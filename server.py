import asyncio, base64, hashlib, hmac, json, os, random, re, secrets, socket, sqlite3, time
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
HOST = '0.0.0.0'
PORT = int(os.environ.get('PORT') or os.environ.get('MISHADROP_PORT') or '3000')
DB_PATH = Path(os.environ.get('MISHADROP_DB', str(ROOT / 'mishadrop.db')))
MAX_BODY = 2_000_000
rooms = {}
clients = set()


def db():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA journal_mode=WAL')
    c.execute('''CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      save_json TEXT NOT NULL DEFAULT '{}',
      score INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      opened INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )''')
    c.commit()
    return c


def hash_password(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    h = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 180_000)
    return salt.hex(), h.hex()


def check_password(password, salt_hex, digest):
    _, got = hash_password(password, bytes.fromhex(salt_hex))
    return hmac.compare_digest(got, digest)


def user_public(row):
    return {'id': row['id'], 'username': row['username'], 'score': row['score'], 'level': row['level'], 'opened': row['opened']}


def auth_token(token):
    if not token: return None
    c = db(); row = c.execute('''SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>?''', (token, int(time.time()))).fetchone(); c.close()
    return row


def create_session(uid):
    token = secrets.token_urlsafe(40)
    c = db(); c.execute('INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)', (token, uid, int(time.time()) + 60*60*24*30)); c.commit(); c.close()
    return token


def parse_auth(headers):
    for line in headers.split('\r\n'):
        if line.lower().startswith('authorization:'):
            v=line.split(':',1)[1].strip()
            if v.lower().startswith('bearer '): return v[7:].strip()
    return None

async def json_response(writer, obj, status='200 OK'):
    b=json.dumps(obj, ensure_ascii=False, separators=(',',':')).encode()
    hdr=f'HTTP/1.1 {status}\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: {len(b)}\r\nCache-Control: no-store\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: Content-Type, Authorization\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nConnection: close\r\n\r\n'.encode()
    writer.write(hdr+b); await writer.drain(); writer.close(); await writer.wait_closed()

async def send_text(writer, text, status='200 OK', ctype='text/html; charset=utf-8'):
    b=text.encode('utf-8') if isinstance(text,str) else text
    hdr=f'HTTP/1.1 {status}\r\nContent-Type: {ctype}\r\nContent-Length: {len(b)}\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n'.encode()
    writer.write(hdr+b); await writer.drain(); writer.close(); await writer.wait_closed()

async def serve_file(writer, target):
    if target in ('','/'): target='/index.html'
    rel=target.lstrip('/')
    if '..' in Path(rel).parts: return await send_text(writer,'Forbidden','403 Forbidden','text/plain')
    p=(ROOT/rel).resolve()
    if not str(p).startswith(str(ROOT.resolve())) or not p.is_file(): return await send_text(writer,'Not found','404 Not Found','text/plain')
    types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.txt':'text/plain; charset=utf-8','.json':'application/json'}
    b=p.read_bytes(); ctype=types.get(p.suffix,'application/octet-stream')
    hdr=f'HTTP/1.1 200 OK\r\nContent-Type: {ctype}\r\nContent-Length: {len(b)}\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n'.encode()
    writer.write(hdr+b); await writer.drain(); writer.close(); await writer.wait_closed()

async def read_http(reader):
    data=await reader.readuntil(b'\r\n\r\n'); return data.decode('iso-8859-1','ignore')

async def read_body(reader, headers):
    n=0
    for line in headers.split('\r\n'):
        if line.lower().startswith('content-length:'):
            n=int(line.split(':',1)[1].strip()); break
    if n<0 or n>MAX_BODY: raise ValueError('body too large')
    return await reader.readexactly(n) if n else b''

async def recv_ws(reader):
    h=await reader.readexactly(2); b1,b2=h; masked=bool(b2&0x80); n=b2&0x7f
    if n==126:n=int.from_bytes(await reader.readexactly(2),'big')
    elif n==127:n=int.from_bytes(await reader.readexactly(8),'big')
    if n>MAX_BODY:raise ValueError('frame too large')
    mask=await reader.readexactly(4) if masked else None; payload=bytearray(await reader.readexactly(n))
    if mask:
        for i in range(n):payload[i]^=mask[i%4]
    op=b1&0x0f
    if op==0x8:return None
    if op!=0x1:return ''
    return payload.decode('utf-8','ignore')

async def send_ws(writer,data):
    payload=json.dumps(data,ensure_ascii=False,separators=(',',':')).encode(); n=len(payload)
    if n<126:h=bytes([0x81,n])
    elif n<65536:h=bytes([0x81,126])+n.to_bytes(2,'big')
    else:h=bytes([0x81,127])+n.to_bytes(8,'big')
    writer.write(h+payload); await writer.drain()

def room_code():
    chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    while True:
        c=''.join(random.choice(chars) for _ in range(6))
        if c not in rooms:return c

def room_count(r):return len(r['players'])

async def broadcast(room,msg,exclude=None):
    tasks=[]
    for c in list(room['players'].values()):
        if c is exclude:continue
        if not c['closed']:tasks.append(send_ws(c['writer'],msg))
    if tasks:await asyncio.gather(*tasks,return_exceptions=True)

async def handle_ws(reader,writer,hdr):
    key=None
    for line in hdr.split('\r\n'):
        if line.lower().startswith('sec-websocket-key:'):key=line.split(':',1)[1].strip();break
    if not key: writer.close(); await writer.wait_closed(); return
    accept=base64.b64encode(hashlib.sha1((key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').encode()).digest()).decode()
    writer.write(('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n').encode());await writer.drain()
    client={'reader':reader,'writer':writer,'room':None,'player':None,'closed':False,'username':'Guest','user_id':None}
    clients.add(writer); await send_ws(writer,{'type':'serverReady','online':True})
    try:
        while True:
            raw=await recv_ws(reader)
            if raw is None:break
            if not raw:continue
            try:m=json.loads(raw)
            except:continue
            typ=m.get('type'); room=rooms.get(client['room']) if client['room'] else None
            if typ=='auth':
                row=auth_token(str(m.get('token',''))); client['user_id']=row['id'] if row else None; client['username']=row['username'] if row else 'Guest'; await send_ws(writer,{'type':'auth','ok':bool(row),'username':client['username']}); continue
            if typ=='create':
                if client['room']:await send_ws(writer,{'type':'error','message':'Ты уже в комнате.'});continue
                maxp=max(2,min(6,int(m.get('maxPlayers',2))));code=room_code();room={'code':code,'maxPlayers':maxp,'caseIndex':max(0,int(m.get('caseIndex',0))),'players':{},'round':0,'results':{}}
                rooms[code]=room;client['room']=code;client['player']=1;room['players'][1]=client
                await send_ws(writer,{'type':'created','room':code,'player':1,'maxPlayers':maxp,'caseIndex':room['caseIndex'],'count':1,'username':client['username']});await broadcast(room,{'type':'players','count':1,'maxPlayers':maxp,'names':[client['username']]},exclude=client)
            elif typ=='join':
                code=str(m.get('room','')).upper();room=rooms.get(code)
                if not room:await send_ws(writer,{'type':'error','message':'Комната не найдена.'});continue
                if room_count(room)>=room['maxPlayers']:await send_ws(writer,{'type':'error','message':'Комната заполнена.'});continue
                player=max(room['players'].keys(),default=0)+1;client['room']=code;client['player']=player;room['players'][player]=client
                await send_ws(writer,{'type':'joined','room':code,'player':player,'maxPlayers':room['maxPlayers'],'caseIndex':room['caseIndex'],'count':room_count(room),'username':client['username']})
                await broadcast(room,{'type':'players','count':room_count(room),'maxPlayers':room['maxPlayers'],'names':[x['username'] for x in room['players'].values()]})
            elif typ=='config' and room and client['player']==1:
                room['maxPlayers']=max(2,min(6,int(m.get('maxPlayers',2))));room['maxPlayers']=max(room['maxPlayers'],room_count(room));await broadcast(room,{'type':'config','maxPlayers':room['maxPlayers']})
            elif typ=='case' and room and client['player']==1:
                room['caseIndex']=max(0,int(m.get('caseIndex',0)));await broadcast(room,{'type':'case','caseIndex':room['caseIndex']})
            elif typ=='start' and room and client['player']==1:
                if room_count(room)<2:continue
                room['round']=int(m.get('round') or random.randint(100000,999999));room['results']={};await broadcast(room,{'type':'start','caseIndex':room['caseIndex'],'round':room['round']})
            elif typ=='result' and room:
                if int(m.get('round',0))!=int(room['round']):continue
                room['results'][client['player']]={'player':client['player'],'value':float(m.get('value',0)),'name':str(m.get('name','')),'rarity':str(m.get('rarity','')),'username':client['username']}
                if len(room['results'])>=room_count(room):
                    ranked=sorted(room['results'].values(),key=lambda x:x['value'],reverse=True);winner=ranked[0]['player'] if ranked else 0
                    await broadcast(room,{'type':'results','results':room['results'],'winner':winner});room['round']=0;room['results']={}
            elif typ=='leave':break
    except (asyncio.IncompleteReadError,ConnectionError,ValueError,OSError):pass
    finally:
        client['closed']=True;clients.discard(writer);code=client['room']
        if code and code in rooms:
            room=rooms[code];room['players'].pop(client['player'],None)
            if not room['players']:rooms.pop(code,None)
            else:await broadcast(room,{'type':'players','count':room_count(room),'maxPlayers':room['maxPlayers'],'names':[x['username'] for x in room['players'].values()]})
        try:writer.close();await writer.wait_closed()
        except:pass

async def api(reader,writer,method,path,headers):
    if method=='OPTIONS':return await json_response(writer,{'ok':True})
    body=await read_body(reader,headers)
    try:data=json.loads(body or b'{}')
    except: data={}
    token=parse_auth(headers); row=auth_token(token)
    if path=='/api/health':return await json_response(writer,{'ok':True,'rooms':len(rooms),'users':db().execute('SELECT COUNT(*) FROM users').fetchone()[0]})
    if path=='/api/register' and method=='POST':
        u=str(data.get('username','')).strip();pw=str(data.get('password',''))
        if not re.fullmatch(r'[A-Za-z0-9_\-А-Яа-яЁё]{3,20}',u):return await json_response(writer,{'error':'Никнейм: 3–20 символов, буквы/цифры/_/-. '},'400 Bad Request')
        if len(pw)<6:return await json_response(writer,{'error':'Пароль должен быть минимум 6 символов.'},'400 Bad Request')
        salt,dig=hash_password(pw);c=db()
        try:c.execute('INSERT INTO users(username,password_hash,salt,created_at) VALUES(?,?,?,?)',(u,dig,salt,int(time.time())));c.commit();uid=c.execute('SELECT id FROM users WHERE username=?',(u,)).fetchone()[0]
        except sqlite3.IntegrityError:c.close();return await json_response(writer,{'error':'Такой никнейм уже занят.'},'409 Conflict')
        c.close();tok=create_session(uid);r=auth_token(tok);return await json_response(writer,{'token':tok,'user':user_public(r)})
    if path=='/api/login' and method=='POST':
        u=str(data.get('username','')).strip();pw=str(data.get('password',''));c=db();r=c.execute('SELECT * FROM users WHERE username=?',(u,)).fetchone();c.close()
        if not r or not check_password(pw,r['salt'],r['password_hash']):return await json_response(writer,{'error':'Неверный никнейм или пароль.'},'401 Unauthorized')
        tok=create_session(r['id']);return await json_response(writer,{'token':tok,'user':user_public(r)})
    if path=='/api/me' and method=='GET':
        if not row:return await json_response(writer,{'error':'Не авторизован'},'401 Unauthorized')
        return await json_response(writer,{'user':user_public(row)})
    if path=='/api/logout' and method=='POST':
        if token:
            c=db();c.execute('DELETE FROM sessions WHERE token=?',(token,));c.commit();c.close()
        return await json_response(writer,{'ok':True})
    if path=='/api/save' and method=='GET':
        if not row:return await json_response(writer,{'error':'Не авторизован'},'401 Unauthorized')
        return await json_response(writer,{'save':json.loads(row['save_json'] or '{}'),'user':user_public(row)})
    if path=='/api/save' and method=='POST':
        if not row:return await json_response(writer,{'error':'Не авторизован'},'401 Unauthorized')
        keys=data.get('keys');
        if not isinstance(keys,dict) or len(keys)>300:return await json_response(writer,{'error':'Некорректное сохранение.'},'400 Bad Request')
        # Derive leaderboard score from the same save fields used by the game.
        def num(k):
            try:return int(float(keys.get(k,0)))
            except:return 0
        score=max(0,num('cr_coins')//10 + num('cr_xp') + num('cr_opened')*25 + num('cr_seasonXp')*2)
        level=max(1, num('cr_xp')//100 + 1)
        opened=max(0,num('cr_opened'))
        c=db();c.execute('UPDATE users SET save_json=?,score=?,level=?,opened=? WHERE id=?',(json.dumps({'keys':keys},ensure_ascii=False,separators=(',',':')),score,level,opened,row['id']));c.commit();r=c.execute('SELECT * FROM users WHERE id=?',(row['id'],)).fetchone();c.close()
        return await json_response(writer,{'ok':True,'user':user_public(r)})
    if path=='/api/leaderboard' and method=='GET':
        c=db();rs=c.execute('SELECT username,score,level,opened FROM users ORDER BY score DESC,opened DESC LIMIT 50').fetchall();c.close();return await json_response(writer,{'players':[dict(x) for x in rs]})
    return await json_response(writer,{'error':'Not found'},'404 Not Found')

async def client(reader,writer):
    try:
        hdr=await asyncio.wait_for(read_http(reader),5); first=hdr.split('\r\n',1)[0];parts=first.split(' ');method=parts[0] if parts else 'GET';target=parts[1] if len(parts)>1 else '/'
        if 'Upgrade: websocket' in hdr and urlparse(target).path=='/ws':await handle_ws(reader,writer,hdr);return
        path=urlparse(target).path
        if path.startswith('/api/'):
            await api(reader,writer,method,path,hdr);return
        await serve_file(writer,path)
    except Exception as e:
        try:await send_text(writer,'Server error','500 Internal Server Error','text/plain')
        except:pass

async def main():
    db().close();srv=await asyncio.start_server(client,HOST,PORT)
    print(f'MishaDrop ONLINE server: http://0.0.0.0:{PORT}')
    print(f'Database: {DB_PATH}')
    async with srv:await srv.serve_forever()

if __name__=='__main__':asyncio.run(main())
