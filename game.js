

let clickerCount=Number(localStorage.getItem('cr_clickerCount')||0);
let arenaTeam=[]; let arenaRating=Number(localStorage.getItem('cr_arenaRating')||1000); let arenaWins=Number(localStorage.getItem('cr_arenaWins')||0); let arenaMatches=Number(localStorage.getItem('cr_arenaMatches')||0);
let overdrive=localStorage.getItem('cr_overdrive')!=='0'; let soundOn=localStorage.getItem('cr_sound')!=='0';
document.body.classList.toggle('overdrive',overdrive);
function beep(freq=520,dur=.07){if(!soundOn)return;try{let A=window.AudioContext||window.webkitAudioContext,ctx=new A(),o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=freq;o.type='sine';g.gain.value=.035;o.connect(g);g.connect(ctx.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+dur);o.stop(ctx.currentTime+dur)}catch(e){}}
function toggleOverdrive(){overdrive=!overdrive;localStorage.setItem('cr_overdrive',overdrive?'1':'0');document.body.classList.toggle('overdrive',overdrive);document.getElementById('overdriveSwitch').classList.toggle('on',overdrive);beep(640)}
function toggleSound(){soundOn=!soundOn;localStorage.setItem('cr_sound',soundOn?'1':'0');document.getElementById('soundSwitch').classList.toggle('on',soundOn);if(soundOn)beep(700)}
function exportSave(){let data={version:3,keys:{}};for(let i=0;i<localStorage.length;i++){let k=localStorage.key(i);if(k&&k.startsWith('cr_'))data.keys[k]=localStorage.getItem(k)};data.missions={};data.collections={};data.season={};data.endgame=localStorage.getItem('cr_endgame_v1');for(let i=0;i<10;i++)data.missions[i]=localStorage.getItem('mission_'+i);for(let i=0;i<10;i++)data.collections[i]=localStorage.getItem('col_'+i);for(let i=0;i<40;i++)data.season[i]=localStorage.getItem('season_'+i);let blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='caserush-save.json';a.click();URL.revokeObjectURL(a.href);toast('Сохранение экспортировано');}
function importSave(e){let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let d=JSON.parse(r.result);Object.entries(d.keys||{}).forEach(([k,v])=>localStorage.setItem(k,v));Object.entries(d.missions||{}).forEach(([k,v])=>v===null?localStorage.removeItem('mission_'+k):localStorage.setItem('mission_'+k,v));Object.entries(d.collections||{}).forEach(([k,v])=>v===null?localStorage.removeItem('col_'+k):localStorage.setItem('col_'+k,v));Object.entries(d.season||{}).forEach(([k,v])=>v===null?localStorage.removeItem('season_'+k):localStorage.setItem('season_'+k,v));if(d.endgame)localStorage.setItem('cr_endgame_v1',d.endgame);toast('Сохранение импортировано');setTimeout(()=>location.reload(),500)}catch(err){toast('Файл сохранения повреждён')}};r.readAsText(f)}
function resetGame(){if(!confirm('Удалить ВЕСЬ прогресс игры? Это действие нельзя отменить.'))return;if(!confirm('Точно сбросить монеты, XP, инвентарь, кейсы, мини-игры, рынок, магазин и использованные промокоды?'))return;Object.keys(localStorage).filter(k=>k.startsWith('cr_')||k.startsWith('mission_')||k.startsWith('col_')||k.startsWith('season_')||k==='cr_endgame_v1').forEach(k=>localStorage.removeItem(k));toast('Прогресс удалён. Начинаем заново!');setTimeout(()=>location.reload(),350)}
function renderArena(){document.getElementById('arenaRating').textContent=arenaRating;document.getElementById('arenaWins').textContent=arenaWins;document.getElementById('arenaMatches').textContent=arenaMatches;document.getElementById('teamPower').textContent=arenaTeam.reduce((a,s)=>a+s.v,0);document.getElementById('arenaPick').innerHTML=inv.length?inv.map((s,i)=>{let chosen=arenaTeam.includes(s);return `<div class="skin ${chosen?'done':''}" style="border-color:${s.c}88;cursor:pointer" onclick="toggleArenaItem(${i})"><div class="rarity" style="color:${s.c}">${s.rarity}</div><div class="name">${s.name}</div><div class="small">Сила ${s.v}</div><div class="small">${chosen?'✓ В КОМАНДЕ':'Нажми для выбора'}</div></div>`}).join(''):'<div class="muted">Сначала собери предметы.</div>'}
function toggleArenaItem(i){let s=inv[i];let idx=arenaTeam.indexOf(s);if(idx>=0){arenaTeam.splice(idx,1)}else if(arenaTeam.length<3){arenaTeam.push(s);beep(590)}else{toast('Максимум 3 предмета');return}renderArena()}
function clearArena(){arenaTeam=[];document.getElementById('botPower').textContent='—';document.getElementById('botName').textContent='Готов к матчу';document.getElementById('arenaLog').textContent='Собери команду и нажми «Начать матч».';renderArena()}
function startArena(){if(!arenaTeam.length){toast('Выбери хотя бы один предмет');return}let power=arenaTeam.reduce((a,s)=>a+s.v,0), names=['Pixel Wolf','Nova Byte','Void Runner','Chrome Ace','Neon Ghost'];let bot=Math.max(300,Math.floor(power*(.72+Math.random()*.65)));let botName=names[Math.floor(Math.random()*names.length)];arenaMatches++;let win=power>=bot;arenaRating=Math.max(0,arenaRating+(win?25:-12));if(win){arenaWins++;coins+=Math.max(60,Math.floor(power*.08));gainXP(80);seasonXp+=60;document.getElementById('arenaLog').innerHTML=`<b style="color:#63e59a">ПОБЕДА!</b> Твоя команда набрала ${power} силы против ${bot}. Получено виртуальных наград.`;beep(880,.12)}else{gainXP(20);document.getElementById('arenaLog').innerHTML=`<b style="color:#ff8da6">ПОРАЖЕНИЕ</b> ${botName} набрал ${bot}. Улучши команду и попробуй снова.`;beep(180,.12)}document.getElementById('botPower').textContent=bot;document.getElementById('botName').textContent=botName;novaStat('matches',1);if(win)novaStat('wins',1);arenaHistory.unshift({bot:botName,power:bot,win:win,at:Date.now()});saveNovaArena();localStorage.setItem('cr_arenaRating',arenaRating);localStorage.setItem('cr_arenaWins',arenaWins);localStorage.setItem('cr_arenaMatches',arenaMatches);save();update();renderArena()}

const nameMigrations={"dasbaeb":"babysya","Unusual Sketch":"dedys","Football Kid":"pisyka","Red Football":"DotA chat","Misha Relic":"chat misha","Field Legend":"pobedil"};
const skins=[
{name:"dedys",rarity:"Необычный",image:"assets/green-orbit.svg",c:"#63e59a",v:17.5,w:18},
{name:"babysya",rarity:"Обычный",image:"assets/neon-mask.svg",c:"#a9b0bd",v:8.5,w:24},
{name:"Glitch Fox",rarity:"Обычный",image:"assets/neon-mask.svg",c:"#a9b0bd",v:7.0,w:42},
{name:"Cyber Leaf",rarity:"Обычный",image:"assets/neon-mask.svg",c:"#72d58b",v:10.0,w:30},
{name:"Pixel Rush",rarity:"Обычный",image:"assets/neon-mask.svg",c:"#c4cad4",v:12.0,w:26},
{name:"Ruby Spark",rarity:"Обычный",image:"assets/neon-mask.svg",c:"#ff7184",v:14.5,w:23},
{name:"pisyka",rarity:"Редкий",image:"assets/blue-comet.svg",c:"#4da9ff",v:21.0,w:15},
{name:"DotA chat",rarity:"Эпический",image:"assets/purple-glitch.svg",c:"#b66cff",v:65.0,w:4.5},
{name:"Neon Fang",rarity:"Редкий",image:"assets/cyan-viper.svg",c:"#38d7c1",v:26.0,w:12},
{name:"Crimson Wave",rarity:"Редкий",image:"assets/red-dragon.svg",c:"#ff4660",v:31.0,w:10},
{name:"Laser Viper",rarity:"Редкий",image:"assets/blue-comet.svg",c:"#7c8cff",v:36.0,w:8},
{name:"Solar Edge",rarity:"Эпический",image:"assets/purple-glitch.svg",c:"#b66cff",v:48.0,w:7},
{name:"Quantum",rarity:"Эпический",image:"assets/purple-glitch.svg",c:"#8c7cff",v:62.0,w:5},
{name:"Blood Circuit",rarity:"Эпический",image:"assets/purple-glitch.svg",c:"#ff426d",v:76.0,w:4},
{name:"Quantum Shard",rarity:"Эпический",image:"assets/purple-glitch.svg",c:"#45f0d0",v:90.0,w:3},
{name:"pobedil",rarity:"Легендарный",image:"assets/gold-crown.svg",c:"#ffbd4a",v:140.0,w:1.8},
{name:"Aurora Core",rarity:"Легендарный",image:"assets/gold-crown.svg",c:"#ffbd4a",v:120.0,w:2.2},
{name:"Dragon Pulse",rarity:"Легендарный",image:"assets/orange-spark.svg",c:"#ff775b",v:180.0,w:1.5},
{name:"Royal Inferno",rarity:"Легендарный",image:"assets/orange-spark.svg",c:"#ff9a3d",v:220.0,w:1.1},
{name:"Golden Nova",rarity:"Легендарный",image:"assets/gold-crown.svg",c:"#ffe66d",v:250.0,w:.9},
{name:"Void Crown",rarity:"Мифический",image:"assets/pink-void.svg",c:"#ff4c86",v:300.0,w:.55},
{name:"Crimson Phantom",rarity:"Мифический",image:"assets/red-dragon.svg",c:"#ff174f",v:380.0,w:.38},
{name:"Season Phantom",rarity:"Мифический",image:"assets/pink-void.svg",c:"#9c7bff",v:450.0,w:.25},
{name:"Cosmic Relic",rarity:"Мифический",image:"assets/pink-void.svg",c:"#ff5cf0",v:600.0,w:.12},
{name:"chat misha",rarity:"Мифический",c:"#ff244d",v:900.0,w:.04},
{name:"NOVA Crown",rarity:"Божественный",image:"assets/white-nova.svg",c:"#ffffff",v:1500.0,w:.01}
];
const cases=[
{name:"Ну это база",price:100,glow:"#ff244d33",accent:"#ff4660",desc:"Кейс для тех, кто начинает с базы.",tier:0},
{name:"Жиза",price:150,glow:"#ff365733",accent:"#ff5b73",desc:"Когда хотел обычный дроп, а получил что-то редкое.",tier:.08},
{name:"Повезёт в этот раз",price:200,glow:"#ff6b3d33",accent:"#ff8a5b",desc:"Классика: ещё один кейс и точно повезёт.",tier:.16},
{name:"Ну давай",price:280,glow:"#ff9f4333",accent:"#ffb85c",desc:"Рискнул — значит давай до конца.",tier:.24},
{name:"Имба",price:350,glow:"#ffd34d33",accent:"#ffe16b",desc:"Кейс с усиленными шансами на хорошие предметы.",tier:.32},
{name:"Легко",price:450,glow:"#b7ff4d33",accent:"#c8ff6a",desc:"Выглядит легко. Пока не открыл.",tier:.4},
{name:"Го ещё",price:550,glow:"#55ff8a33",accent:"#68ff9b",desc:"После первого открытия остановиться уже сложно.",tier:.5},
{name:"Вот это дроп",price:700,glow:"#39e6c833",accent:"#52f0d8",desc:"Для тех самых моментов, когда чат замолкает.",tier:.62},
{name:"Шок-контент",price:850,glow:"#38c8ff33",accent:"#5bd8ff",desc:"Шансы становятся всё интереснее.",tier:.74},
{name:"АХАХА",price:1000,glow:"#4587ff33",accent:"#679cff",desc:"Когда выпало совсем не то, что ожидал.",tier:.86},
{name:"Чисто на удачу",price:1200,glow:"#765cff33",accent:"#9278ff",desc:"Высокие шансы на эпические предметы.",tier:.98},
{name:"Кринж, но беру",price:1400,glow:"#a64dff33",accent:"#b66cff",desc:"Странно? Да. Открыть? Конечно.",tier:1.1},
{name:"Момент истины",price:1600,glow:"#d44dff33",accent:"#df6cff",desc:"Здесь начинаются действительно дорогие дропы.",tier:1.22},
{name:"Сейчас будет",price:1800,glow:"#ff4dc433",accent:"#ff6bdd",desc:"Тот самый кейс перед большим дропом.",tier:1.34},
{name:"Опа-на",price:2000,glow:"#ff4d9133",accent:"#ff6aa7",desc:"Редкие и мифические предметы ближе, чем кажется.",tier:1.46},
{name:"Ну всё",price:2300,glow:"#ff405b33",accent:"#ff6377",desc:"Финальный уровень обычного открытия.",tier:1.58},
{name:"Я в шоке",price:2600,glow:"#ff244d44",accent:"#ff4267",desc:"Для охотников за ультраредкими предметами.",tier:1.7},
{name:"Это реально?",price:2900,glow:"#ff6a3d44",accent:"#ff825c",desc:"Шанс увидеть предмет, который захочется сохранить навсегда.",tier:1.82},
{name:"Повезло так повезло",price:3200,glow:"#ffb52e44",accent:"#ffc54d",desc:"Очень дорогой кейс с мощным пулом наград.",tier:1.94},
{name:"Кто понял тот понял",price:3500,glow:"#e6cf4544",accent:"#f1dc64",desc:"Редкость начинается здесь.",tier:2.06},
{name:"Невероятно",price:4000,glow:"#a5e64b44",accent:"#b9f266",desc:"Шансы на мифические предметы повышены.",tier:2.18},
{name:"Без комментариев",price:4500,glow:"#55e67a44",accent:"#6bf38e",desc:"Кейс для настоящих коллекционеров.",tier:2.3},
{name:"Вот это поворот",price:5000,glow:"#43ddd844",accent:"#62eee8",desc:"Непредсказуемый набор дорогих наград.",tier:2.42},
{name:"МЫ СДЕЛАЛИ ЭТО",price:6000,glow:"#4da7ff44",accent:"#69b8ff",desc:"Почти вершина коллекции.",tier:2.56},
{name:"Это база",price:7500,glow:"#9b5cff44",accent:"#ae78ff",desc:"Элитный кейс с максимальным риском и наградой.",tier:2.72},
{name:"ФИНАЛЬНЫЙ БОСС",price:10000,glow:"#ff245544",accent:"#ff4668",desc:"Самый дорогой кейс mishadrop.",tier:3}
,{name:"Пиксельный старт",price:70,glow:"#ffdd4433",accent:"#ffe15c",desc:"Маленький кейс с быстрыми наградами.",tier:.04}
,{name:"Неоновый двор",price:800,glow:"#00f0ff33",accent:"#4deaff",desc:"Неон, скорость и шанс на редкие предметы.",tier:2.9}
,{name:"Космо-микс",price:900,glow:"#7c5cff44",accent:"#9c86ff",desc:"Космический набор для охотников за эпиком.",tier:3.15}
,{name:"Драконий огонь",price:1100,glow:"#ff5b2244",accent:"#ff7b45",desc:"Огненный кейс с усиленными шансами.",tier:3.35}
,{name:"Ледяной шторм",price:1300,glow:"#4de8ff44",accent:"#78efff",desc:"Холодный кейс с неожиданными дропами.",tier:3.55}
,{name:"Золотой портал",price:1550,glow:"#ffd43d55",accent:"#ffe36d",desc:"Золотой путь к легендарным предметам.",tier:3.8}
,{name:"Мифический хаос",price:1800,glow:"#ff36b455",accent:"#ff67cf",desc:"Очень редкие предметы встречаются чаще.",tier:4.05}
,{name:"NOVA MAX",price:2200,glow:"#ffffff55",accent:"#ffffff",desc:"Максимальный кейс для самых смелых коллекционеров.",tier:4.4}
];
// Дополнительные 50 кейсов: от 1 000 до 50 000 монет.
const extraCaseNames=[
  'Неоновый экспресс','Кибер-пульс','Глитч-лаунч','Радужный дроп','Тёмная орбита','Плазменный удар','Космо-рейс','Лазерный порт','Фантомный ящик','Мега-искрa',
  'Золотой шторм','Хромированный сон','Вортекс','Ночной пиксель','Квантовый бокс','Сверхновая','Турбо-кейс','Астральный дроп','Магма-кейс','Ледяной кристалл',
  'Космический сейф','Нова-удар','Роял-дроп','Драконий портал','Теневой кейс','Галактический сейф','Фиолетовый вихрь','Алмазный поток','Режим бога','Импульс MAX',
  'Мифический сейф','Золотая комета','Красный портал','Секретный дроп','Абсолют','Ультра-заряд','Кейс чемпиона','Сверхдроп','Королевский vault','Финальный рейд',
  'NOVA PRIME','NOVA ULTRA','NOVA TITAN','COSMIC BOSS','GOLDEN BOSS','MYTHIC BOSS','INFINITY','ULTIMATE X','MAXIMUM','THE FINAL CASE'
];
extraCaseNames.forEach((name,i)=>{
  const price=1000+i*1000;
  const hue=(i*37)%360;
  cases.push({name,price,glow:`hsl(${hue} 90% 60% / .22)`,accent:`hsl(${hue} 95% 68%)`,desc:`Премиальный кейс за ${price.toLocaleString('ru-RU')} ⭐ с повышенными шансами на редкий дроп.`,tier:3.1+i*.09});
});
// Увеличиваем стоимость всех кейсов для более серьёзной экономики.
cases.forEach(c=>{c.price=Math.round(c.price*2);});
// 16 супер-кейсов от 200 000 до 4 000 000 монет.
const megaCasePrices=[200000,400000,600000,800000,1000000,1200000,1400000,1600000,1800000,2000000,2250000,2500000,2750000,3000000,3500000,4000000];
const megaCaseNames=[
  'Оверклок','Титанический дроп','Имперский vault','Галактический фонд','Нова Миллион','Космо-Император','Чёрная дыра','Абсолютный сейф',
  'Звёздный капитал','Квантовый трон','Пиксельный миллиардер','Сверхновая элита','Корона вселенной','Infinity Vault','Ultimate Misha','FINAL BOSS'
];
megaCasePrices.forEach((price,i)=>{
  const hue=(285+i*19)%360;
  cases.push({name:megaCaseNames[i],price,glow:`hsl(${hue} 95% 65% / .28)`,accent:`hsl(${hue} 95% 72%)`,desc:`Сверхдорогой кейс за ${price.toLocaleString('ru-RU')} ⭐ с полным набором редкостей.`,tier:6+i*.35});
});
// Уникальные случайные названия для всех 84 кейсов и их предметов.
const randomCaseNames = ["Неоновый капсула", "Пиксельный капсула", "Астральный кристалл", "Золотой генезис", "Алмазный разлом", "Космический капсула", "Сапфировый разлом", "Алмазный реактор", "Лунный генезис", "Космический шторм", "Звёздный кристалл", "Метеоритный протокол", "Алмазный дроп", "Солнечный генезис", "Пиксельный поток", "Плазменный разлом", "Астральный вихрь", "Астральный шторм", "Магический орбита", "Сверхновый лабиринт", "Алмазный сектор", "Звёздный портал", "Нулевой сейф", "Кибер архив", "Нулевой капсула", "Пиксельный бункер", "Солнечный портал", "Рубиновый шторм", "Фантомный экспедиция", "Сверхновый импульс", "Кибер модуль", "Фиолетовый шторм", "Плазменный терминал", "Космический терминал", "Алмазный рубеж", "Неоновый протокол", "Лунный поток", "Звёздный коридор", "Космический архив", "Сапфировый лабиринт", "Кибер узел", "Метеоритный шторм", "Пиксельный рубеж", "Загадочный лабиринт", "Сверхновый сейф", "Золотой импульс", "Плазменный портал", "Квантовый дроп", "Фантомный бункер", "Лунный капсула", "Сверхновый контейнер", "Сапфировый поток", "Орбитальный контейнер", "Хромовый генезис", "Солнечный архив", "Астральный разлом", "Космический протокол", "Тёмный орбита", "Астральный сигнал", "Неоновый разлом", "Пиксельный импульс", "Метеоритный резерв", "Хромовый модуль", "Теневой модуль", "Неоновый орбита", "Неоновый экспедиция", "Звёздный реактор", "Метеоритный разлом", "Сапфировый архив", "Неоновый бункер", "Фантомный шторм", "Орбитальный сейф", "Рубиновый рубеж", "Лунный лабиринт", "Солнечный разлом", "Астральный резерв", "Пиксельный сейф", "Нулевой контейнер", "Сверхновый сектор", "Метеоритный генезис", "Теневой генезис", "Фантомный капсула", "Квантовый сигнал", "Фиолетовый вихрь"];
const randomWeaponNames = ["Galaxy Runner", "Eclipse Hammer", "Plasma Reaper", "Cosmic Rifle", "Lunar Rifle", "Photon Fang", "Quantum Breaker", "Eclipse Breaker", "Plasma Raptor", "Photon Scythe", "Aether Breaker", "Cosmic Viper", "Aether Raptor", "Lunar Runner", "Photon Runner", "Quantum Pulse", "Plasma Warden", "Dark Spear", "Gravity Hammer", "Void Phantom", "Warp Fang", "Stellar Warden", "Gravity Crusher", "Meteor Phantom", "Quantum Rifle", "Lunar Phantom", "Dark Scythe", "Star Crusher", "Nova Blade", "Aether Crusher", "Void Talon", "Plasma Howler", "Eclipse Raptor", "Star Breaker", "Nebula Talon", "Galaxy Fang", "Meteor Rifle", "Solar Reaper", "Photon Howler", "Nebula Howler", "Gravity Spear", "Eclipse Phantom", "Void Crusher", "Galaxy Crusher", "Cosmic Scythe", "Eclipse Blade", "Gravity Reaper", "Nebula Cannon", "Aether Pulse", "Warp Phantom", "Nebula Reaper", "Cosmic Hammer", "Star Blade", "Hyper Spear", "Lunar Spear", "Nova Runner", "Cosmic Lance", "Star Phantom", "Aether Blade", "Plasma Hammer", "Nova Breaker", "Void Fang", "Cosmic Warden", "Star Runner", "Plasma Pulse", "Nova Pulse", "Hyper Fang", "Nebula Raptor", "Hyper Blade", "Solar Spear", "Galaxy Phantom", "Quantum Pike", "Solar Phantom", "Solar Fang", "Meteor Hammer", "Warp Hammer", "Void Warden", "Aurora Breaker", "Void Lance", "Solar Lance", "Cosmic Spear", "Photon Hammer", "Eclipse Lance", "Lunar Raptor"];
const generatedCaseNames=megaCaseNames;
const generatedWeaponNames=['Titan Nova','Imperial Pulse','Galaxy Monarch','Blackhole Edge','Quantum Crown','Cosmic Titan','Supernova Blade','Infinity Core','Astral Emperor','Void Colossus','Hypernova Lance','Eclipse Sovereign','Stellar Destroyer','Omega Phantom','Misha Prime','Final Singularity'];
cases.forEach((c,i)=>{
  c.name=randomCaseNames[i] || generatedCaseNames[i-randomCaseNames.length] || `Mega Case ${i+1}`;
  c.weaponName=randomWeaponNames[i] || generatedWeaponNames[i-randomWeaponNames.length] || `Omega Weapon ${i+1}`;
  c.weapon=c.weaponName;
});
const weaponNames=["Nova Raptor","Void Comet","Astral Viper","Quantum Lynx","Solar Phantom","Eclipse Runner","Nebula Talon","Cosmic Warden","Plasma Orbit","Starfall Edge","Gravity Pulse","Lunar Specter","Meteor Fang","Aurora Strike","Galaxy Shard","Dark Matter X","Orbit Breaker","Photon Lance","Supernova Core","Astro Hammer","Blackhole Pike","Starlight Reaver","Warp Talon","Rocket Nova","Void Circuit","Cyber Meteor","Titan Beam","Warp Cutter","Crystal Nova","Moon Howler","Plasma Scythe","Solar Forge","Night Orbit","Cosmo Reaper","Quantum Spear","Meteor Edge","Galaxy Howler","Nova Breaker","Eclipse Cannon","Aether Rifle","Starforge Prime","Void Drifter","Aurora Burst","Hypernova Ray","Darkstar Blade","Orbit Blaster","Photon Reaper","Gravity Fang","Cosmic Rail","Nebula Hammer","Moonlight Cannon","Plasma Phantom","Solar Vortex","Astro Crusher","Warpfire Core","Comet Lance","Voidstorm","Galactic Fang","Quantum Blaster","Stellar Pike","Black Nova","Aurora Crusher","Meteor Rush","Eclipse Talon","Hyperdrive X","Cosmo Cyclone","Starfall Rifle","Dark Orbit","Photon Saber","Gravity Pulse X","Nebula Knight","Solar Flare","Void Titan","Lunar Strike","Nova Cyclone","Quantum Howler","Aether Breaker","Cosmic Scorpion","Stardust Cannon","Infinity Fang","Galactic Monarch","Final Eclipse","Nova Specter","Void Emperor"];
// Состав предметов по цене кейса. В дорогих кейсах теперь есть все редкости,
// а не только божественные.
const ALL_RARITIES=["Обычный","Необычный","Редкий","Эпический","Легендарный","Мифический","Божественный"];
function raritySetForCase(c){
  const p=Number(c.price)||0;
  if(p>=5000) return ALL_RARITIES.slice();
  if(p>=3000) return ["Обычный","Необычный","Редкий","Эпический","Легендарный"];
  if(p>=1500) return ["Обычный","Необычный","Редкий","Эпический"];
  if(p>=700) return ["Обычный","Необычный","Редкий"];
  if(p>=300) return ["Обычный","Необычный"];
  return ["Обычный"];
}
const rarityPrefixes=["Nova","Void","Astra","Pixel","Quantum","Solar","Lunar","Neon","Cosmo","Shadow","Meteor","Plasma","Orbit","Crystal","Stellar","Hyper","Echo","Vortex","Frost","Ember"];
const rarityTypes=["Blade","Core","Pulse","Fang","Drive","Shard","Cannon","Rifle","Hammer","Spear","Claw","Ray","Burst","Engine","Warden","Phantom","Edge","Lance","Crusher","Runner"];
const caseItemNames=[];
let uniqueItemCounter=1;
cases.forEach((c,i)=>{
  c.rarities=raritySetForCase(c);
  c.itemNames=c.rarities.map((rarity,j)=>{
    const name=`${rarityPrefixes[(i*3+j)%rarityPrefixes.length]} ${rarityTypes[(i*7+j*2)%rarityTypes.length]} ${String(uniqueItemCounter++).padStart(3,'0')}`;
    caseItemNames.push(name);
    return name;
  });
});
const caseAvatars=cases.map((_,i)=>`assets/case-avatars/case-${String(i+1).padStart(3,'0')}.svg`);
cases.forEach((c,i)=>c.avatar=caseAvatars[i]);
// NOVA EVENT CASES — добавляем поверх существующего пула, ничего не удаляя.
const novaEventCases=[
 ['Северное сияние',12000,'#67e8ff'],['Фантомный рейд',16000,'#b78cff'],['Кибер-шторм',21000,'#ff6cae'],
 ['Золотая орбита',28000,'#ffd45c'],['Тёмная материя',36000,'#8b7cff'],['Нулевая гравитация',45000,'#70f3ad'],
 ['Сверхновая X',60000,'#ff718d'],['NOVA LEGACY',80000,'#c77cff'],['Имперский дроп',110000,'#ffd45c'],
 ['COSMIC RAID',150000,'#62e8ff'],['ULTIMATE NOVA',220000,'#ff6cae'],['MISHADROP INFINITY',350000,'#ffffff']
];
novaEventCases.forEach((x,i)=>{
  const [name,price,accent]=x;
  const rarities=price>=100000?ALL_RARITIES.slice():price>=30000?["Обычный","Необычный","Редкий","Эпический","Легендарный","Мифический"]:["Обычный","Необычный","Редкий","Эпический","Легендарный"];
  const itemNames=rarities.map((r,j)=>`NOVA ${r} ${String(900+i*10+j).padStart(3,'0')}`);
  cases.push({name,price,glow:accent+'33',accent,desc:`Событийный кейс NOVA за ${price.toLocaleString('ru-RU')} ⭐. Новый сезонный пул наград.`,tier:7+i*.3,rarities,itemNames,weapon:`NOVA Event ${i+1}`,avatar:caseAvatars[i%caseAvatars.length]});
});


// 10 ПРЕМИУМ-КЕЙСОВ — от 5 000 000 до 10 000 000 ⭐
const ultraMillionCases=[
 ['IMPERIAL MILLION',5000000,'#ffd45c'],
 ['GALAXY MILLION',5555556,'#62e8ff'],
 ['COSMIC MILLION',6111111,'#b78cff'],
 ['NOVA MILLION',6666667,'#ff6cae'],
 ['QUANTUM MILLION',7222222,'#70f3ad'],
 ['INFINITY MILLION',7777778,'#8b7cff'],
 ['ROYAL MILLION',8333333,'#ffd45c'],
 ['OMEGA MILLION',8888889,'#ff718d'],
 ['ULTIMATE MILLION',9444444,'#c77cff'],
 ['MISHADROP BILLION',10000000,'#ffffff']
];
ultraMillionCases.forEach((x,i)=>{
  const [name,price,accent]=x;
  const rarities=ALL_RARITIES.slice();
  const itemNames=rarities.map((r,j)=>`MILLION ${r} ${String(1100+i*10+j).padStart(4,'0')}`);
  cases.push({name,price,glow:accent+'44',accent,desc:`Сверхпремиальный кейс за ${price.toLocaleString('ru-RU')} ⭐.`,tier:12+i*.45,rarities,itemNames,weapon:`Million Weapon ${i+1}`,avatar:`assets/case-avatars/case-${String(101+i).padStart(3,'0')}.svg`});
});

function caseWeights(c){
  const allowed=new Set(c.rarities||ALL_RARITIES);
  const rarityBoost={"Обычный":1,"Необычный":1.12,"Редкий":1.05,"Эпический":1.0,"Легендарный":.78,"Мифический":.52,"Божественный":.25};
  return skins.map(s=>{
    if(!allowed.has(s.rarity)) return 0;
    const base=Math.max(.001,Number(s.w)||1);
    const tierBoost={"Обычный":Math.max(.18,1-c.tier*.13),"Необычный":Math.max(.22,1-c.tier*.08),"Редкий":Math.max(.3,1-c.tier*.03),"Эпический":1+c.tier*.08,"Легендарный":1+c.tier*.22,"Мифический":1+c.tier*.4,"Божественный":1+c.tier*.7}[s.rarity]||1;
    return base*rarityBoost[s.rarity]*tierBoost;
  });
}
let materials=+(localStorage.cr_materials||0),seasonXp=+(localStorage.cr_seasonXp||0),dailyStreak=+(localStorage.cr_streak||0),lastDay=localStorage.cr_lastDay||"",coins=+(localStorage.cr_coins||1000),xp=+(localStorage.cr_xp||0),opened=+(localStorage.cr_opened||0),inv=JSON.parse(localStorage.cr_inv||"[]"),totalValue=+(localStorage.cr_value||0),best=JSON.parse(localStorage.cr_best||"null"),selectedCase=0,invFilter="all";
const imageBySkin={
  "babysya":"assets/neon-mask.svg","dedys":"assets/green-orbit.svg","pisyka":"assets/blue-comet.svg","DotA chat":"assets/purple-glitch.svg","chat misha":"assets/red-dragon.svg","pobedil":"assets/gold-crown.svg"
};
inv=inv.map(s=>{const n=nameMigrations[s.name]||s.name;return {...s,name:n,image:imageBySkin[n]||s.image||"assets/neon-mask.svg"}});
if(best){const n=nameMigrations[best.name]||best.name;best={...best,name:n,image:imageBySkin[n]||best.image||"assets/neon-mask.svg"};}


function save(){localStorage.cr_clickerCount=clickerCount;localStorage.cr_materials=materials;localStorage.cr_seasonXp=seasonXp;localStorage.cr_streak=dailyStreak;localStorage.cr_lastDay=lastDay;localStorage.cr_coins=Math.floor(coins);localStorage.cr_xp=xp;localStorage.cr_opened=opened;localStorage.cr_inv=JSON.stringify(inv);localStorage.cr_value=totalValue;localStorage.cr_best=JSON.stringify(best)}
function level(){return Math.floor(xp/500)+1}
function xpIn(){return xp%500}
const promoCodes={
  "promo26":true,"2026":true,"misha":true,"hahaha27":true,"new years":true,"2015":true,"17":true,"mishanya":true,"mq":true,"qq":true,"1337":true,"1488":true,"1007":true,"177":true
};
function normalizePromoCode(value){
  return String(value||"").trim().toLowerCase().replace(/\s+/g," ");
}
function redeemPromoPage(){
  const el=document.getElementById('promoInputPage');
  if(!el){toast('Поле промокода не найдено');return}
  const code=normalizePromoCode(el.value);
  if(!code){toast('Введи промокод');el.focus();return}
  if(!promoCodes[code]){toast('Такого промокода нет');return}
  const key='cr_promo_used_'+code.replace(/[^a-z0-9]+/g,'_');
  if(localStorage.getItem(key)==='1'){toast('Этот промокод уже использован');return}
  coins+=3000; gainXP(1000); seasonXp+=500; localStorage.setItem(key,'1'); save(); update(); el.value=''; beep(820,.12); toast('Промокод активирован: +3000 монет и +1000 XP');
}
window.redeemPromoPage=redeemPromoPage;
function redeemPromo(){
  const el=document.getElementById("promoInput");
  if(!el){toast("Поле промокода не найдено");return}
  const code=normalizePromoCode(el.value);
  if(!code){toast("Введи промокод");el.focus();return}
  if(!promoCodes[code]){toast("Такого промокода нет");return}
  const key="cr_promo_used_"+code.replace(/[^a-z0-9]+/g,"_");
  if(localStorage.getItem(key)==="1"){toast("Этот промокод уже использован");return}
  coins+=3000;
  gainXP(1000);
  seasonXp+=500;
  localStorage.setItem(key,"1");
  save();
  update();
  el.value="";
  beep(820,.12);
  toast("Промокод активирован: +3000 монет и +1000 XP");
}
window.redeemPromo=redeemPromo;
function toast(s){let t=document.getElementById("toast");t.textContent=s;t.classList.add("on");setTimeout(()=>t.classList.remove("on"),2200)}
function go(page){if(page==='admin'&&!ensureAdmin())return;beep(440);document.body.classList.toggle("menu-red",page==="dashboard");document.querySelectorAll(".side button").forEach(b=>b.classList.toggle("active",b.dataset.page===page));document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===page));window.scrollTo({top:0,behavior:"smooth"});update()}
document.querySelectorAll(".side button").forEach(b=>b.onclick=()=>go(b.dataset.page));

function renderClicker(){
  const count=document.getElementById("clickCount");
  const total=document.getElementById("clickerTotal");
  const earned=document.getElementById("clickerEarned");
  const balance=document.getElementById("clickerCoins");
  if(count) count.textContent=clickerCount;
  if(total) total.textContent=clickerCount;
  if(earned) earned.textContent=clickerCount+" ⭐";
  if(balance) balance.textContent=Math.floor(coins);
}
function clickerClick(){
  clickerCount++;
  coins+=1;
  gainXP(1);
  seasonXp+=1;
  save();
  renderClicker();
  updateProfile();
  const b=document.getElementById("clickerButton");
  if(b){b.classList.remove("click-pop");void b.offsetWidth;b.classList.add("click-pop");}
  beep(520,.025);
}

function itemVisual(s){
  if(s && s.image) return `<img class="skin-photo" src="${s.image}" alt="${s.name||"Скин"}">`;
  return `<div class="skin-placeholder">${s && s.rarity ? "◆" : "?"}</div>`;
}

function valueForCase(s,c){
  const rarityBase={"Обычный":Math.max(6,c.price*.045),"Необычный":Math.max(11,c.price*.072),"Редкий":Math.max(18,c.price*.105),"Эпический":Math.max(32,c.price*.15),"Легендарный":Math.max(70,c.price*.24),"Мифический":Math.max(150,c.price*.42),"Божественный":Math.max(500,c.price*.8)};
  const rarityFactor=rarityBase[s.rarity]||s.v||100;
  const styleFactor=.9+Math.random()*.22;
  return Math.max(25,Math.round(rarityFactor*styleFactor));
}
function pick(){
  const c=cases[selectedCase];
  const weights=caseWeights(c),total=weights.reduce((a,b)=>a+b,0);
  if(total<=0) return skins[0];
  let r=Math.random()*total;
  for(let i=0;i<skins.length;i++){r-=weights[i];if(r<=0){
    const base=skins[i];
    const ri=(c.rarities||ALL_RARITIES).indexOf(base.rarity);
    return {...base,name:(c.itemNames&&c.itemNames[ri])||base.name,caseItemName:(c.itemNames&&c.itemNames[ri])||base.name};
  }}
  const fallback=skins.find(s=>weights[skins.indexOf(s)]>0)||skins[0];
  const ri=(c.rarities||ALL_RARITIES).indexOf(fallback.rarity);
  return {...fallback,name:(c.itemNames&&c.itemNames[ri])||fallback.name,caseItemName:(c.itemNames&&c.itemNames[ri])||fallback.name};
}
function renderCases(){document.getElementById("caseGrid").innerHTML=cases.map((c,i)=>`<div class="card case-card" style="--glow:${c.glow};--accent:${c.accent}" onclick="selectCase(${i})"><div class="case-art"><img class="case-avatar" src="${c.avatar}" alt="Аватар кейса"><div class="case-box">CASE</div></div><div class="rarity" style="color:${c.accent}">${i===5?"ULTIMATE":"CASE "+(i+1)}</div><div class="name">${c.name}</div><div class="small">${c.desc}<br>🔫 ${c.weapon}<br>✨ ${c.rarities.join(" • ")}<br>🎁 ${c.itemNames.slice(0,6).join(" • ")}${c.itemNames.length>6?' • …':''}</div><div class="case-price"><b>${c.price} ⭐</b><span>Открыть →</span></div></div>`).join("")}
function selectCase(i){
  i=Number(i);
  if(!Number.isInteger(i)||!cases[i]){toast("Этот кейс недоступен");return}
  selectedCase=i;
  let c=cases[i];
  const panel=document.getElementById("openPanel"),name=document.getElementById("selectedName"),desc=document.getElementById("selectedDesc"),big=document.getElementById("bigCase"),box=document.getElementById("bigBox"),btn=document.getElementById("openBtn"),roulette=document.getElementById("roulette");
  if(!panel||!name||!desc||!big||!box||!btn){toast("Ошибка интерфейса кейса");return}
  panel.style.display="block";
  if(roulette)roulette.style.display="none";
  name.textContent=c.name;
  desc.textContent=c.desc+" Оружие: "+c.weapon+" • Цена: "+c.price+" ⭐ • Предметы: "+(c.itemNames||[]).join(", ");
  big.style.setProperty("--glow",c.glow);
  big.style.setProperty("--accent",c.accent);
  box.style.borderColor=c.accent;
  box.style.boxShadow=`0 0 80px ${c.glow}`;
  const avatar=document.getElementById("bigCaseAvatar");
  if(avatar) avatar.src=c.avatar;
  btn.disabled=false;
  btn.textContent=`ОТКРЫТЬ — ${c.price} ⭐`;
  panel.scrollIntoView({behavior:"smooth",block:"start"});
}
function closeCase(){document.getElementById("openPanel").style.display="none"}
let caseOpening=false,caseTimer=null;
function openCase(count=1){
  count=Math.max(1,Math.min(10,Number(count)||1));
  if(caseOpening)return;
  const c=cases[Number(selectedCase)];
  const btn=document.getElementById("openBtn"),track=document.getElementById("track"),roulette=document.getElementById("roulette");
  if(!c||!btn||!track||!roulette){toast("Не удалось открыть кейс. Выбери кейс ещё раз.");return}
  if(count>1){
    let totalPrice=0, tokenUse=0;
    for(let i=0;i<count;i++){
      if(caseTokens-tokenUse>0){tokenUse++; totalPrice+=Math.max(1,Math.floor(c.price*.5));}
      else totalPrice+=Math.max(1,Number(c.price)||0);
    }
    if(!Number.isFinite(coins)||coins<totalPrice){toast(`Не хватает валюты: нужно ${totalPrice.toLocaleString('ru-RU')} ⭐`);return}
    const drops=[]; let batchValue=0, batchReward=0;
    for(let i=0;i<count;i++){
      const win=pick(); if(!win)continue;
      if(tokenUse>0){caseTokens--;tokenUse--;}
      const paid=caseTokens>=0 && false ? c.price : c.price;
      const drop={...win,v:valueForCase(win,c),dropCase:c.name,weapon:c.weapon};
      inv.push(drop); drops.push(drop); batchValue+=drop.v;
      totalValue+=drop.v; opened++; novaStat('opened',1);
      const reward=Math.max(8,Math.floor(drop.v*.28)); batchReward+=reward;
      gainXP(Math.max(40,Math.floor((c.price*.5)/2)));
      if(!best||drop.v>best.v)best=drop;
    }
    coins-=totalPrice; coins+=batchReward; save(); update();
    const rare=drops.filter(x=>['Легендарный','Мифический','Божественный'].includes(x.rarity)).length;
    toast(`Открыто ${drops.length} шт. • +${batchReward} ⭐ • редких: ${rare}`);
    return;
  }
  const hasToken=caseTokens>0;
  let price=Number(c.price)||0;
  if(hasToken)price=Math.floor(price*.5);
  price=Math.max(1,price);
  if(!Number.isFinite(coins)||coins<price){toast(`Не хватает валюты: нужно ${price} ⭐`);return}
  if(hasToken){caseTokens--;saveShop()}
  const win=pick();
  if(!win){toast("Не удалось определить награду. Попробуй ещё раз.");return}
  caseOpening=true;
  btn.disabled=true;
  coins-=price;
  save();
  const arr=Array.from({length:38},()=>pick()||skins[0]);
  arr[32]=win;
  roulette.style.display="block";
  track.innerHTML=arr.map(s=>`<div class="item" style="--c:${s.c}">${itemVisual(s)}<b>${s.name}</b><small>${s.rarity}</small></div>`).join("");
  track.style.transition="none";
  track.style.transform="translateX(0)";
  void track.offsetWidth;
  const itemStep=159, itemWidth=150, containerWidth=roulette.clientWidth||1000;
  const target=(32*itemStep)+10+(itemWidth/2)-(containerWidth/2);
  requestAnimationFrame(()=>{track.style.transition="transform 3.7s cubic-bezier(.08,.78,.08,1)";track.style.transform=`translateX(-${Math.max(0,target)}px)`;});
  clearTimeout(caseTimer);
  caseTimer=setTimeout(()=>{
    opened++; novaStat('opened',1);
    const drop={...win,v:valueForCase(win,c),dropCase:c.name,weapon:c.weapon};
    inv.push(drop); totalValue+=drop.v; gainXP(Math.max(40,Math.floor(price/2)));
    if(!best||drop.v>best.v)best=drop;
    const reward=Math.max(8,Math.floor(drop.v*.28)); coins+=reward; save(); update();
    btn.disabled=false; caseOpening=false;
    toast(`Получен ${drop.name} • ${drop.weapon}! Цена: ${drop.v} ⭐ • +${reward} ⭐`);
  },3900);
}
function sell(i){let s=inv[i];if(!s)return;let gain=Math.max(10,Math.floor(s.v*.62));let mat=Math.max(1,Math.floor(s.v/180));coins+=gain;materials+=mat;totalValue-=s.v;inv.splice(i,1);gainXP(15);seasonXp+=25;save();update();toast(`Продано за ${gain} ⭐ и +${mat} материала`)}
function filterInv(f,el){invFilter=f;document.querySelectorAll("#invTabs button").forEach(b=>b.classList.remove("active"));el.classList.add("active");renderInventory()}
function renderInventory(){let q=(document.getElementById("invSearch")?.value||"").toLowerCase();let arr=inv.map((s,i)=>({...s,_i:i}));if(invFilter!=="all")arr=arr.filter(s=>s.rarity===invFilter);if(q)arr=arr.filter(s=>s.name.toLowerCase().includes(q));document.getElementById("invCount").textContent=inv.length;document.getElementById("invGrid").innerHTML=arr.length?arr.slice().reverse().map(s=>`<div class="skin" style="border-color:${s.c}66">${itemVisual(s)}<div class="rarity" style="color:${s.c}">${s.rarity}</div><div class="name">${s.name}</div><div class="small">${s.weapon?"🔫 "+s.weapon+" • ":""}Ценность ${s.v} ⭐</div><button onclick="sell(${s._i})">ПРОДАТЬ</button></div>`).join(""):'<div class="muted" style="grid-column:1/-1;text-align:center;padding:50px">Здесь пока пусто.</div>'}
let selectedUpgrade=new Set();
const upgradeRarities=["Обычный","Необычный","Редкий","Эпический","Легендарный","Мифический","Божественный"];
function toggleUpgrade(i){if(!inv[i])return;if(selectedUpgrade.has(i))selectedUpgrade.delete(i);else selectedUpgrade.add(i);renderUpgrade()}
function upgrade(){let ids=[...selectedUpgrade].filter(i=>Number.isInteger(i)&&inv[i]);if(ids.length<3){toast("Выбери минимум 3 скина");return}
let rarity=inv[ids[0]].rarity;if(!ids.every(i=>inv[i]&&inv[i].rarity===rarity)){toast("Для апгрейда нужны скины одной редкости");return}
let r=upgradeRarities.indexOf(rarity);if(r<0||r>=upgradeRarities.length-1){toast("Этот скин уже максимальной редкости");return}
let targetRarity=upgradeRarities[r+1];let targets=skins.filter(x=>x.rarity===targetRarity);if(!targets.length){toast("Для этой редкости нет доступного результата");return}
let totalInputValue=ids.reduce((sum,i)=>sum+(Number(inv[i].v)||0),0);
ids.sort((a,b)=>b-a).forEach(i=>inv.splice(i,1));
let target=targets[Math.floor(Math.random()*targets.length)];
let result={name:target.name,rarity:target.rarity,c:target.c,v:target.v,image:target.image||"assets/neon-mask.svg"};
inv.push(result);
totalValue-=totalInputValue;totalValue+=result.v;
selectedUpgrade.clear();gainXP(50+ids.length*10);save();update();toast(`Апгрейд успешен: ${ids.length} скинов → ${result.name}`)}
function renderUpgrade(){let valid=new Set([...selectedUpgrade].filter(i=>Number.isInteger(i)&&inv[i]));selectedUpgrade=valid;
let groups={};inv.forEach((s,i)=>{if(!groups[s.rarity])groups[s.rarity]=[];groups[s.rarity].push({s,i})});
let html=Object.keys(groups).length?Object.entries(groups).map(([rarity,items])=>`<div class="card" style="grid-column:1/-1"><div class="rarity" style="color:${items[0].s.c}">${rarity}</div><div class="small">Выбери минимум 3 скина одной редкости → получишь 1 скин следующей редкости.</div><div class="grid3" style="margin-top:12px">${items.map(({s,i})=>`<div class="card" style="cursor:pointer;border:1px solid ${selectedUpgrade.has(i)?s.c:"#263149"}" onclick="toggleUpgrade(${i})">${itemVisual(s)}<div class="rarity" style="color:${s.c}">${s.rarity}</div><h3>${s.name}</h3><div class="small">Ценность ${s.v} ⭐</div><div style="margin-top:10px">${selectedUpgrade.has(i)?"✓ ВЫБРАН":"Нажми, чтобы выбрать"}</div></div>`).join("")}</div></div>`).join(""):'<div class="muted">Нужен хотя бы один предмет.</div>';
let count=selectedUpgrade.size;html+=`<div class="card" style="grid-column:1/-1;text-align:center"><b>Выбрано: ${count}</b><div class="small" style="margin:8px 0 12px">Все выбранные скины будут заменены на один более дорогой.</div><button class="btn" style="width:100%;padding:12px" onclick="upgrade()" ${count<3?"disabled":""}>АПГРЕЙДИТЬ ${count} → 1</button></div>`;
document.getElementById("upgradeGrid").innerHTML=html}
const missionDefs=[["Открывающий","Открой 5 кейсов",()=>opened,5,250],["Коллекционер","Собери 15 предметов",()=>inv.length,15,500],["Ветеран","Достигни 5 уровня",level,5,800],["Состояние","Набери 5000 ⭐ ценности",()=>totalValue,5000,1000],["Охотник","Получи легендарный предмет",()=>inv.some(s=>s.rarity==="Легендарный")?1:0,1,700]];
function renderMissions(){document.getElementById("missionGrid").innerHTML=missionDefs.map((m,i)=>{let cur=m[2](),done=cur>=m[3],claimed=localStorage.getItem("mission_"+i);return `<div class="card mission ${done?"done":""}"><div class="rarity" style="color:${done?"#63e59a":"#5ce1ff"}">${done?"ГОТОВО":"ЗАДАНИЕ"}</div><h3>${m[0]}</h3><div class="small">${m[1]}</div><div class="progress" style="margin-top:12px"><i style="width:${Math.min(100,cur/m[3]*100)}%"></i></div><div class="small">${Math.min(cur,m[3])}/${m[3]}</div><button class="btn ${done?"":"alt"} style="margin-top:12px;width:100%;padding:10px" ${!done||claimed?"disabled":""} onclick="claimMission(${i})">${claimed?"ПОЛУЧЕНО":done?"ЗАБРАТЬ "+m[4]+" ⭐":"В ПРОЦЕССЕ"}</button></div>`}).join("")}
function claimMission(i){if(localStorage.getItem("mission_"+i))return;localStorage.setItem("mission_"+i,"1");coins+=missionDefs[i][4];gainXP(100);save();update();toast("Награда получена!")}
const achievements=[["Первые шаги","Открой 1 кейс",()=>opened>=1],["Десять","Открой 10 кейсов",()=>opened>=10],["Большая коллекция","Собери 25 предметов",()=>inv.length>=25],["Легенда","Получи легендарный предмет",()=>inv.some(s=>s.rarity==="Легендарный")],["Мифический охотник","Получи мифический предмет",()=>inv.some(s=>s.rarity==="Мифический")],["Богач","Набери 10000 ценности",()=>totalValue>=10000],["Крафтер","Создай предмет через крафт",()=>inv.some(s=>s.name==="Quantum Shard"||s.name==="Golden Nova")],["Сезонный","Достигни 10 сезонного уровня",()=>seasonXp>=900]];
function renderAchievements(){document.getElementById("achievementGrid").innerHTML=achievements.map((a,i)=>`<div class="card achievement ${a[2]()?"done":""}"><div class="rarity" style="color:${a[2]?"#63e59a":"#ffc857"}">★ ${a[2]?"РАЗБЛОКИРОВАНО":"ЗАКРЫТО"}</div><h3>${a[0]}</h3><div class="small">${a[1]}</div></div>`).join("")}
function updateProfile(){let l=level(),xin=xpIn();document.getElementById("streak").textContent=dailyStreak;document.getElementById("dashStreak").textContent=dailyStreak;document.getElementById("levelText").textContent="Уровень "+l;document.getElementById("xp").textContent=xp;document.getElementById("profileLevel").textContent=l;document.getElementById("profileOpened").textContent=opened;document.getElementById("profileValue").textContent=totalValue;document.getElementById("xpNeed").textContent=`${xin} / 500 XP`;document.getElementById("xpBar").style.width=(xin/5)+"%";document.getElementById("heroLevel").textContent=l;document.getElementById("heroOpened").textContent=opened;document.getElementById("heroItems").textContent=inv.length;document.getElementById("heroValue").textContent=totalValue;document.getElementById("leaderboard").innerHTML=[["Ты",totalValue],["NightFox",Math.max(1200,totalValue-400)],["CyberMax",Math.max(900,totalValue-800)],["Aurora",Math.max(700,totalValue-1100)],["VoidHunter",Math.max(500,totalValue-1500)]].sort((a,b)=>b[1]-a[1]).map((r,i)=>`<div class="row"><div class="rank">#${i+1}</div><div><b>${r[0]}</b><div class="small">Коллекционер</div></div><b>${r[1]} ⭐</b></div>`).join("")}

function craftItem(){if(materials<8){toast("Нужно 8 материалов");return}materials-=8;let s={name:"Quantum Shard",rarity:"Эпический",image:"assets/purple-glitch.svg",c:"#45f0d0",v:90.0};inv.push(s);totalValue+=s.v;gainXP(80);seasonXp+=100;save();update();toast("Создан Quantum Shard!")}
function craftGolden(){if(materials<20||coins<500){toast("Нужно 20 материалов и 500 ⭐");return}materials-=20;coins-=500;let s={name:"Golden Nova",rarity:"Легендарный",image:"assets/gold-crown.svg",c:"#ffe66d",v:250.0};inv.push(s);totalValue+=s.v;gainXP(150);seasonXp+=180;save();update();toast("Создан Golden Nova!")}
function collectionComplete(names){return names.every(n=>inv.some(s=>s.name===n))}
const collections=[
["Neon Squad",["Glitch Fox","Cyber Leaf","Pulse","Neon Fang"],250],
["Galaxy Hunters",["Solar Edge","Quantum","Aurora Core"],700],
["Legends",["Dragon Pulse","Void Crown","Cosmic Relic"],1500],
["Forged",["Quantum Shard","Golden Nova"],900]
];
function renderCollections(){document.getElementById("collectionsGrid").innerHTML=collections.map((c,i)=>{let done=collectionComplete(c[1]),claimed=localStorage.getItem("col_"+i);return `<div class="card ${done?"done":""}"><div class="rarity" style="color:${done?"#63e59a":"#b66cff"}">${done?"СОБРАНО":"КОЛЛЕКЦИЯ"}</div><h3>${c[0]}</h3><div class="small">${c[1].join(" • ")}</div><div class="small" style="margin-top:12px">${c[1].filter(n=>inv.some(s=>s.name===n)).length}/${c[1].length}</div><button class="btn ${done?"":"alt"} style="margin-top:12px;width:100%" ${!done||claimed?"disabled":""} onclick="claimCollection(${i})">${claimed?"ПОЛУЧЕНО":done?"ЗАБРАТЬ "+c[2]+" ⭐":"СОБИРАЙ"}</button></div>`}).join("")}
function claimCollection(i){if(localStorage.getItem("col_"+i))return;localStorage.setItem("col_"+i,"1");coins+=collections[i][2];gainXP(120);seasonXp+=150;save();update();toast("Коллекция завершена!")}
function renderSeason(){let level=Math.min(30,Math.floor(seasonXp/100)+1);document.getElementById("seasonXp").textContent=seasonXp;document.getElementById("seasonProgress").textContent=`Уровень ${level} • ${seasonXp%100}/100 XP`;document.getElementById("seasonBar").style.width=((seasonXp%100))+"%";document.getElementById("seasonGrid").innerHTML=Array.from({length:30},(_,i)=>{let unlocked=level>=i+1;let claimed=localStorage.getItem("season_"+i);let reward=(i+1)*75;return `<div class="card ${unlocked?"done":""}"><div class="rarity" style="color:${unlocked?"#63e59a":"#6d7890"}">УРОВЕНЬ ${i+1}</div><h3>${i%5===4?"Большая награда":"Награда"}</h3><div class="small">+${reward} ⭐ ${i%5===4?"• бонусный предмет":""}</div><button class="btn ${unlocked?"":"alt"}" style="margin-top:12px;width:100%;padding:10px" ${!unlocked||claimed?"disabled":""} onclick="claimSeason(${i})">${claimed?"ПОЛУЧЕНО":unlocked?"ЗАБРАТЬ":"ЗАКРЫТО"}</button></div>`}).join("")}
function claimSeason(i){if(localStorage.getItem("season_"+i))return;localStorage.setItem("season_"+i,"1");coins+=(i+1)*75;if(i%5===4){let s={name:"Season Phantom",rarity:"Мифический",image:"assets/pink-void.svg",c:"#9c7bff",v:450.0};inv.push(s);totalValue+=s.v}save();update();toast("Сезонная награда получена!")}
function dailyCheck(){let today=new Date().toDateString();if(lastDay!==today){dailyStreak=lastDay?Math.min(7,dailyStreak+1):1;lastDay=today;coins+=100+dailyStreak*50;gainXP(30);seasonXp+=40;save()}}
function update(){ensureNovaDay();ensureDailyChallenge();document.getElementById("coins").textContent=Math.floor(coins);const hud=document.getElementById("coinsHud");if(hud)hud.textContent=Math.floor(coins);renderCases();renderInventory();renderUpgrade();renderMissions();renderCollections();renderSeason();renderAchievements();updateProfile();document.getElementById("materials").textContent=materials;renderDailyChallenge();renderArenaHistory();renderClicker();renderBombs();renderMiniGames();}

/* ===== CASE RUSH NOVA SYSTEMS ===== */
let dailyChallenge = JSON.parse(localStorage.getItem('cr_dailyChallenge')||'null');
let arenaHistory = JSON.parse(localStorage.getItem('cr_arenaHistory')||'[]');
let todayStats = JSON.parse(localStorage.getItem('cr_todayStats')||'null');

function novaDay(){
  return new Date().toISOString().slice(0,10);
}
function ensureNovaDay(){
  const d=novaDay();
  if(!todayStats || todayStats.day!==d){
    todayStats={day:d,opened:0,matches:0,wins:0,xp:0,bombsSafe:0};
    localStorage.setItem('cr_todayStats',JSON.stringify(todayStats));
  }
}
function ensureDailyChallenge(){
  ensureNovaDay();
  const d=novaDay();
  if(!dailyChallenge || dailyChallenge.day!==d){
    const pool=[
      {title:'Разогрев коллекционера',desc:'Открой 3 кейса',type:'opened',goal:3,reward:120},
      {title:'Арена зовёт',desc:'Сыграй 2 матча',type:'matches',goal:2,reward:140},
      {title:'Победная серия',desc:'Одержи 2 победы',type:'wins',goal:2,reward:180},
      {title:'XP-рывок',desc:'Получи 250 XP за день',type:'xp',goal:250,reward:160}
    ];
    const pick=pool[Math.floor(Math.random()*pool.length)];
    dailyChallenge={day:d,...pick,claimed:false};
    localStorage.setItem('cr_dailyChallenge',JSON.stringify(dailyChallenge));
  }
}
function dailyValue(){
  ensureNovaDay(); ensureDailyChallenge();
  return Number(todayStats[dailyChallenge.type]||0);
}
function renderDailyChallenge(){
  ensureNovaDay(); ensureDailyChallenge();
  const c=dailyChallenge, val=Math.min(c.goal,dailyValue()), pct=Math.min(100,val/c.goal*100);
  const title=document.getElementById('dailyTitle'); if(title) title.textContent=c.title;
  const desc=document.getElementById('dailyDesc'); if(desc) desc.textContent=c.desc;
  const prog=document.getElementById('dailyProgress'); if(prog) prog.textContent=`${val} / ${c.goal}`;
  const bar=document.getElementById('dailyBar'); if(bar) bar.style.width=pct+'%';
  const reward=document.getElementById('dailyReward'); if(reward) reward.textContent=c.reward+' XP';
  const btn=document.getElementById('dailyClaim');
  if(btn){
    btn.disabled=c.claimed || val<c.goal;
    btn.textContent=c.claimed?'ПОЛУЧЕНО':(val>=c.goal?'ЗАБРАТЬ НАГРАДУ':'В ПРОЦЕССЕ');
  }
  const ids={opened:'todayOpened',matches:'todayMatches',wins:'todayWins',xp:'todayXp'};
  Object.entries(ids).forEach(([k,id])=>{const el=document.getElementById(id);if(el)el.textContent=todayStats[k]||0});
}
function claimDailyChallenge(){
  ensureDailyChallenge();
  if(dailyChallenge.claimed || dailyValue()<dailyChallenge.goal)return;
  dailyChallenge.claimed=true; gainXP(dailyChallenge.reward); seasonXp+=Math.floor(dailyChallenge.reward/2);
  localStorage.setItem('cr_dailyChallenge',JSON.stringify(dailyChallenge));
  save(); update(); toast('⚡ Дневной челлендж завершён!');
}
function gainXP(amount){
  amount=Math.max(0,Number(amount)||0);
  xp+=amount;
  ensureNovaDay();
  todayStats.xp=(todayStats.xp||0)+amount;
  localStorage.setItem('cr_todayStats',JSON.stringify(todayStats));
}
function novaStat(key,amount=1){
  ensureNovaDay();
  todayStats[key]=(todayStats[key]||0)+amount;
  localStorage.setItem('cr_todayStats',JSON.stringify(todayStats));
}

function renderArenaHistory(){
  const el=document.getElementById('arenaHistory'); if(!el)return;
  if(!arenaHistory.length){el.innerHTML='<div class="muted">Пока нет матчей. Твоя история появится здесь.</div>';return}
  el.innerHTML=arenaHistory.slice(0,10).map(x=>`<div class="row"><span>${x.bot}</span><span>${x.power} ⚡</span><b class="${x.win?'win':'loss'}">${x.win?'ПОБЕДА':'ПОРАЖЕНИЕ'}</b></div>`).join('');
}
function saveNovaArena(){
  localStorage.setItem('cr_arenaHistory',JSON.stringify(arenaHistory.slice(0,30)));
  localStorage.setItem('cr_arenaRating',arenaRating);
  localStorage.setItem('cr_arenaWins',arenaWins);
  localStorage.setItem('cr_arenaMatches',arenaMatches);
}

let bombRound=Number(localStorage.getItem('cr_bombRound')||0);
let bombSafe=0;
let bombEarned=Number(localStorage.getItem('cr_bombEarned')||0);
let bombActive=false;
let bombCells=[];
const bombIcons=['💎','⭐','🪙','🔥','⚡','👑','💠','🟥','🎯','✨'];
function saveBombs(){localStorage.setItem('cr_bombRound',bombRound);localStorage.setItem('cr_bombEarned',bombEarned);}
function renderBombs(){const c=document.getElementById('bombCoins');if(c)c.textContent=Math.floor(coins);const r=document.getElementById('bombRound');if(r)r.textContent=bombActive?bombRound:'—';const s=document.getElementById('bombSafe');if(s)s.textContent=bombSafe;const e=document.getElementById('bombEarned');if(e)e.textContent=bombEarned+' ⭐';}
function startBombGame(){bombRound++;bombSafe=0;bombActive=true;bombCells=[];const total=25,bombs=5;let bombSet=new Set();while(bombSet.size<bombs)bombSet.add(Math.floor(Math.random()*total));const board=document.getElementById('bombBoard');if(!board)return;board.innerHTML='';for(let i=0;i<total;i++){const b=document.createElement('button');b.className='bomb-cell';b.type='button';b.dataset.bomb=bombSet.has(i)?'1':'0';b.textContent=bombIcons[Math.floor(Math.random()*bombIcons.length)];b.onclick=()=>pickBombCell(b);board.appendChild(b);bombCells.push(b)}document.getElementById('bombMessage').textContent='Раунд начался! Найди все безопасные иконки и не нажми на бомбу.';document.getElementById('bombStart').textContent='НОВЫЙ РАУНД';saveBombs();renderBombs();beep(600,.08)}
function pickBombCell(cell){if(!bombActive||cell.disabled)return;cell.disabled=true;if(cell.dataset.bomb==='1'){cell.classList.add('bomb');cell.textContent='💣';bombActive=false;bombCells.forEach(x=>{x.disabled=true;if(x.dataset.bomb==='1'){x.textContent='💣';x.classList.add('bomb')}});document.getElementById('bombMessage').textContent='💥 Бомба! Раунд закончен. Нажми «НОВЫЙ РАУНД», чтобы попробовать ещё раз.';beep(150,.18);renderBombs();return}cell.classList.add('safe');cell.textContent='⭐';coins+=100;bombSafe++;bombEarned+=100;gainXP(50);seasonXp+=50;novaStat('bombsSafe',1);save();update();renderBombs();beep(720,.025);if(bombSafe===20){bombActive=false;coins+=20;gainXP(20);bombEarned+=20;document.getElementById('bombMessage').textContent='🏆 Полная зачистка! Бонус +20 ⭐.';save();update();renderBombs()}}

/* ===== MINI GAMES PACK ===== */
let reactionBest=Number(localStorage.getItem('cr_reactionBest')||9999);
let reactionStart=0,reactionTimer=null,reactionReady=false;
function reactionStartGame(){const b=document.getElementById('reactionButton'),m=document.getElementById('reactionMessage');if(!b)return;reactionReady=false;b.disabled=true;b.textContent='ЖДИ...';m.textContent='Жёлтый сигнал... не нажимай раньше времени!';clearTimeout(reactionTimer);reactionTimer=setTimeout(()=>{reactionStart=performance.now();reactionReady=true;b.disabled=false;b.textContent='ЖМИ!';m.textContent='СЕЙЧАС!';beep(880,.08)},900+Math.random()*2200)}
function reactionClick(){if(!reactionReady)return;const ms=Math.round(performance.now()-reactionStart);reactionReady=false;const b=document.getElementById('reactionButton'),m=document.getElementById('reactionMessage');const reward=Math.max(20,Math.round(220-Math.min(ms,200)*.7));coins+=reward;gainXP(35);seasonXp+=35;if(ms<reactionBest){reactionBest=ms;localStorage.setItem('cr_reactionBest',reactionBest)}m.textContent=`Реакция: ${ms} мс • +${reward} ⭐`;b.textContent='ЕЩЁ РАЗ';save();update();beep(700,.06);renderMiniGames()}
function renderReaction(){const el=document.getElementById('reactionBest');if(el)el.textContent=reactionBest<9999?reactionBest+' мс':'—'}
let memoryBoard=[],memoryOpen=[],memoryLock=false,memoryWins=Number(localStorage.getItem('cr_memoryWins')||0);
function startMemory(){const board=document.getElementById('memoryBoard');if(!board)return;const icons=['◆','●','★','▲','✦','✚','⬟','☀'];memoryBoard=[...icons,...icons].sort(()=>Math.random()-.5);memoryOpen=[];memoryLock=false;board.innerHTML=memoryBoard.map((_,i)=>`<button class="memory-card" onclick="memoryPick(${i})">?</button>`).join('');document.getElementById('memoryMessage').textContent='Найди все пары.'}
function memoryPick(i){if(memoryLock||memoryOpen.includes(i))return;const buttons=document.querySelectorAll('.memory-card');buttons[i].textContent=memoryBoard[i];buttons[i].classList.add('open');memoryOpen.push(i);if(memoryOpen.length<2)return;memoryLock=true;const [a,b]=memoryOpen;if(memoryBoard[a]===memoryBoard[b]){buttons[a].classList.add('match');buttons[b].classList.add('match');memoryOpen=[];memoryLock=false;memoryWins++;coins+=80;gainXP(25);seasonXp+=25;localStorage.setItem('cr_memoryWins',memoryWins);save();update();if(document.querySelectorAll('.memory-card.match').length===memoryBoard.length){coins+=250;gainXP(80);seasonXp+=80;document.getElementById('memoryMessage').textContent='🏆 Все пары найдены! Бонус +250 ⭐';save();update()}}else{setTimeout(()=>{buttons[a].textContent='?';buttons[b].textContent='?';buttons[a].classList.remove('open');buttons[b].classList.remove('open');memoryOpen=[];memoryLock=false},650)}}
function renderMemory(){const e=document.getElementById('memoryWins');if(e)e.textContent=memoryWins}
let starScore=0,starTime=20,starTimer=null,starActive=false;
function startStarCatch(){if(starActive)return;starActive=true;starScore=0;starTime=20;const area=document.getElementById('starArea');if(!area)return;area.innerHTML='';document.getElementById('starMessage').textContent='Лови звёзды!';spawnStar();clearInterval(starTimer);starTimer=setInterval(()=>{starTime--;const t=document.getElementById('starTime');if(t)t.textContent=starTime;if(starTime<=0){clearInterval(starTimer);starActive=false;coins+=starScore*12;gainXP(starScore*4);seasonXp+=starScore*5;document.getElementById('starMessage').textContent=`Время! ${starScore} звёзд • +${starScore*12} ⭐`;save();update()}},1000)}
function spawnStar(){if(!starActive)return;const area=document.getElementById('starArea');const s=document.createElement('button');s.className='star-target';s.textContent='★';s.style.left=(5+Math.random()*85)+'%';s.style.top=(8+Math.random()*72)+'%';s.onclick=()=>{starScore++;s.remove();spawnStar();};area.appendChild(s);setTimeout(()=>{if(s.isConnected){s.remove();spawnStar()}},900)}
function renderMiniGames(){renderReaction();renderMemory();const st=document.getElementById('starScore');if(st)st.textContent=starScore;const tt=document.getElementById('starTime');if(tt)tt.textContent=starTime}

/* ===== EXTRA MINI GAMES ===== */
let targetScore=0,targetTime=15,targetTimer=null,targetActive=false;
function startTarget(){if(targetActive)return;targetActive=true;targetScore=0;targetTime=15;const a=document.getElementById('targetArea');a.innerHTML='';document.getElementById('targetMessage').textContent='Попадай по цели!';moveTarget();clearInterval(targetTimer);targetTimer=setInterval(()=>{targetTime--;document.getElementById('targetTime').textContent=targetTime;if(targetTime<=0){clearInterval(targetTimer);targetActive=false;const reward=targetScore*18;coins+=reward;gainXP(targetScore*6);seasonXp+=targetScore*7;document.getElementById('targetMessage').textContent=`Финиш: ${targetScore} попаданий • +${reward} ⭐`;save();update()}},1000)}
function moveTarget(){if(!targetActive)return;const a=document.getElementById('targetArea');const t=document.createElement('button');t.className='mini-target';t.textContent='🎯';t.style.left=(5+Math.random()*82)+'%';t.style.top=(5+Math.random()*72)+'%';t.onclick=()=>{targetScore++;t.remove();moveTarget()};a.appendChild(t);setTimeout(()=>{if(t.isConnected){t.remove();moveTarget()}},850)}
let seq=[],seqInput=[],seqRound=0,seqLock=false;
function startSequence(){seq=[];seqInput=[];seqRound=0;seqLock=false;nextSequence();}
function nextSequence(){seqRound++;seq.push(Math.floor(Math.random()*4));showSequence(()=>{seqInput=[];document.getElementById('sequenceMessage').textContent=`Раунд ${seqRound}: повтори последовательность`;renderSequenceButtons()})}
function showSequence(done){seqLock=true;let i=0;const timer=setInterval(()=>{document.querySelectorAll('.seq-btn').forEach(b=>b.classList.remove('flash'));const b=document.querySelector(`.seq-btn[data-n="${seq[i]}"]`);if(b)b.classList.add('flash');i++;if(i>=seq.length){clearInterval(timer);setTimeout(()=>{document.querySelectorAll('.seq-btn').forEach(b=>b.classList.remove('flash'));seqLock=false;done()},350)}},500)}
function renderSequenceButtons(){const a=document.getElementById('sequenceButtons');a.innerHTML=[0,1,2,3].map(n=>`<button class="seq-btn" data-n="${n}" onclick="sequencePick(${n})">${['🔴','🔵','🟢','🟡'][n]}</button>`).join('')}
function sequencePick(n){if(seqLock)return;seqInput.push(n);const i=seqInput.length-1;if(seqInput[i]!==seq[i]){const reward=Math.max(20,(seqRound-1)*35);coins+=reward;gainXP(seqRound*8);seasonXp+=seqRound*10;document.getElementById('sequenceMessage').textContent=`Ошибка! Достигнут раунд ${seqRound-1} • +${reward} ⭐`;save();update();return}if(seqInput.length===seq.length){coins+=seqRound*30;gainXP(seqRound*10);seasonXp+=seqRound*12;save();update();setTimeout(nextSequence,450)}}
let mathA=0,mathB=0,mathAns=0,mathTime=20,mathTimer=null,mathScore=0,mathActive=false;
function startMath(){mathScore=0;mathTime=20;mathActive=true;newMath();clearInterval(mathTimer);mathTimer=setInterval(()=>{mathTime--;document.getElementById('mathTime').textContent=mathTime;if(mathTime<=0){clearInterval(mathTimer);mathActive=false;const reward=mathScore*22;coins+=reward;gainXP(mathScore*7);seasonXp+=mathScore*8;document.getElementById('mathMessage').textContent=`Время! ${mathScore} правильных • +${reward} ⭐`;save();update()}},1000)}
function newMath(){if(!mathActive)return;mathA=2+Math.floor(Math.random()*15);mathB=2+Math.floor(Math.random()*15);mathAns=mathA+mathB;document.getElementById('mathQuestion').textContent=`${mathA} + ${mathB} = ?`;document.getElementById('mathAnswer').value='';document.getElementById('mathAnswer').focus()}
function answerMath(){if(!mathActive)return;const v=Number(document.getElementById('mathAnswer').value);if(v===mathAns){mathScore++;coins+=12;gainXP(5);seasonXp+=6;document.getElementById('mathMessage').textContent='Верно! +12 ⭐';newMath();save();update()}else{document.getElementById('mathMessage').textContent='Почти! Попробуй следующий пример.';newMath()}}
let dodgeActive=false,dodgeScore=0,dodgeTimer=null;
function startDodge(){if(dodgeActive)return;dodgeActive=true;dodgeScore=0;const a=document.getElementById('dodgeArea');a.innerHTML='';document.getElementById('dodgeMessage').textContent='Уворачивайся от красных кубиков и лови зелёные!';let start=Date.now();clearInterval(dodgeTimer);dodgeTimer=setInterval(()=>{if(Date.now()-start>15000){clearInterval(dodgeTimer);dodgeActive=false;const reward=dodgeScore*20;coins+=reward;gainXP(dodgeScore*6);seasonXp+=dodgeScore*8;document.getElementById('dodgeMessage').textContent=`Финиш: ${dodgeScore} очков • +${reward} ⭐`;save();update();return}const x=document.createElement('button');const good=Math.random()<.62;x.textContent=good?'💚':'🟥';x.className='dodge-item';x.style.left=(Math.random()*85)+'%';x.style.top=(Math.random()*75)+'%';x.onclick=()=>{if(!dodgeActive)return;if(good){dodgeScore++;x.remove()}else{dodgeScore=Math.max(0,dodgeScore-2);x.remove()}};a.appendChild(x);setTimeout(()=>x.remove(),900)},550)}
let coinRushActive=false,coinRush=0,coinRushTimer=null;
function startCoinRush(){if(coinRushActive)return;coinRushActive=true;coinRush=0;let t=15;const a=document.getElementById('coinRushArea');a.innerHTML='';document.getElementById('coinRushMessage').textContent='Собери как можно больше монет!';function spawn(){if(!coinRushActive)return;const x=document.createElement('button');x.className='coin-target';x.textContent='🪙';x.style.left=(5+Math.random()*82)+'%';x.style.top=(5+Math.random()*72)+'%';x.onclick=()=>{coinRush++;x.remove();spawn()};a.appendChild(x);setTimeout(()=>{if(x.isConnected){x.remove();spawn()}},700)}spawn();clearInterval(coinRushTimer);coinRushTimer=setInterval(()=>{t--;document.getElementById('coinRushTime').textContent=t;if(t<=0){clearInterval(coinRushTimer);coinRushActive=false;const reward=coinRush*16;coins+=reward;gainXP(coinRush*5);seasonXp+=coinRush*6;document.getElementById('coinRushMessage').textContent=`Собрано ${coinRush} • +${reward} ⭐`;save();update()}},1000)}


/* ===== SHOP + MARKET ===== */
const shopItems=[
 {id:'lucky',name:'Удачный буст',desc:'+15% к наградам за следующий открытый кейс.',price:120,icon:'🍀',glow:'#63e59a',type:'boost'},
 {id:'xp',name:'XP-ускоритель',desc:'+250 XP сразу.',price:180,icon:'⚡',glow:'#62e8ff',type:'xp'},
 {id:'materials',name:'Пачка материалов',desc:'+12 материалов для крафта.',price:220,icon:'🧱',glow:'#ffc857',type:'materials'},
 {id:'caseToken',name:'Жетон кейса',desc:'Скидка 50% на следующее открытие.',price:260,icon:'🎟️',glow:'#b66cff',type:'token'},
 {id:'mega',name:'Мега-награда',desc:'+750 ⭐ без случайности.',price:700,icon:'💎',glow:'#ff4c86',type:'coins'}
];
let shopBoost=Number(localStorage.getItem('cr_shopBoost')||0),caseTokens=Number(localStorage.getItem('cr_caseTokens')||0);
function saveShop(){localStorage.setItem('cr_shopBoost',shopBoost);localStorage.setItem('cr_caseTokens',caseTokens)}
function renderShop(){
 const grid=document.getElementById('shopGrid'); if(!grid)return;
 const bal=document.getElementById('shopCoins'); if(bal)bal.textContent=Math.floor(coins);
 grid.innerHTML=shopItems.map((x,i)=>`<div class="card shop-item" style="--glow:${x.glow}"><div class="shop-icon">${x.icon}</div><div class="rarity" style="color:${x.glow}">SHOP</div><h3>${x.name}</h3><div class="small">${x.desc}</div><div class="price-row"><b>${x.price} ⭐</b><button class="btn" onclick="buyShop(${i})">КУПИТЬ</button></div></div>`).join('');
 const d=shopItems[(new Date().getDate())%shopItems.length];
 const n=document.getElementById('dailyShopName'),ds=document.getElementById('dailyShopDesc'),b=document.getElementById('dailyShopBtn');
 if(n)n.textContent=d.name+' • -20% сегодня'; if(ds)ds.textContent=d.desc; if(b){b.textContent=`КУПИТЬ • ${Math.floor(d.price*.8)} ⭐`;b.dataset.idx=(new Date().getDate())%shopItems.length}
}
function buyShop(i){const x=shopItems[i];if(!x)return;let price=x.price;if(coins<price){toast('Не хватает ⭐');return}coins-=price;applyShopItem(x);saveShop();save();update();toast(`Куплено: ${x.name}`)}
function buyDailyShop(){const i=Number(document.getElementById('dailyShopBtn')?.dataset.idx||0),x=shopItems[i],price=Math.floor(x.price*.8);if(coins<price){toast('Не хватает ⭐');return}coins-=price;applyShopItem(x);saveShop();save();update();toast(`Ежедневная покупка: ${x.name}`)}
function applyShopItem(x){if(x.type==='boost')shopBoost+=15;if(x.type==='xp'){xp+=250;seasonXp+=150}if(x.type==='materials')materials+=12;if(x.type==='token')caseTokens+=1;if(x.type==='coins')coins+=750}
function marketIndexValue(){const d=new Date();let seed=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();return 92+(seed%25)}
function marketSellValue(s){const rarity={"Обычный":1,"Необычный":1.25,"Редкий":1.6,"Эпический":2.1,"Легендарный":2.8,"Мифический":3.7,"Божественный":5}[s.rarity]||1;return Math.max(5,Math.floor((s.v||10)*.5*rarity*marketIndexValue()/100))}
function renderMarket(){
 const grid=document.getElementById('marketGrid');if(!grid)return;const idx=marketIndexValue();const el=document.getElementById('marketIndex');if(el)el.textContent=idx;
 const mood=document.getElementById('marketMood');if(mood)mood.textContent=idx>=108?'РАСТЁТ':idx<=98?'ПАДАЕТ':'СТАБИЛЬНО';
 if(!inv.length){grid.innerHTML='<div class="muted">У тебя пока нет предметов для продажи. Открой кейс или получи скин.</div>';return}
 grid.innerHTML=inv.map((s,i)=>`<div class="card market-card" style="border-color:${s.c}66">${itemVisual(s)}<div class="rarity" style="color:${s.c}">${s.rarity}</div><h3>${s.name}</h3><div class="small">Рыночная цена меняется каждый день.</div><div class="price-row"><b>${marketSellValue(s)} ⭐</b><button class="btn" onclick="marketSell(${i})">ПРОДАТЬ</button></div></div>`).join('')
}
function marketSell(i){const s=inv[i];if(!s)return;const gain=marketSellValue(s);coins+=gain;materials+=Math.max(1,Math.floor(gain/100));totalValue-=s.v;inv.splice(i,1);gainXP(20);seasonXp+=20;save();update();toast(`Рынок: ${s.name} продан за ${gain} ⭐`)}

/* ===== ADMIN PANEL ===== */
const ADMIN_PIN='177mixa';
let adminUnlocked=localStorage.getItem('cr_adminUnlocked')==='1';
function ensureAdmin(){if(adminUnlocked)return true;const pin=prompt('Введите PIN администратора:');if(pin===ADMIN_PIN){adminUnlocked=true;localStorage.setItem('cr_adminUnlocked','1');toast('Админ-панель разблокирована');return true}toast('Неверный PIN');return false}
function adminAddCoins(n){if(!ensureAdmin())return;coins+=n;save();update();renderAdmin();toast(`+${n.toLocaleString()} ⭐`)}
function adminAddXP(n){if(!ensureAdmin())return;xp+=n;seasonXp+=Math.floor(n*.6);save();update();renderAdmin();toast(`+${n.toLocaleString()} XP`)}
function adminAddMaterials(n){if(!ensureAdmin())return;materials+=n;save();update();renderAdmin();toast(`+${n} материалов`)}
function adminCloneSkin(s){return {name:s.name,rarity:s.rarity,image:s.image,c:s.c,v:s.v}}
function adminGiveSkin(){if(!ensureAdmin())return;const el=document.getElementById('adminSkinSelect');if(!el)return;const s=skins[Number(el.value)];if(!s)return;inv.push(adminCloneSkin(s));totalValue+=s.v;save();update();renderAdmin();toast(`Выдан скин: ${s.name}`)}
function adminGiveAllSkins(){if(!ensureAdmin())return;skins.forEach(s=>{inv.push(adminCloneSkin(s));totalValue+=s.v});save();update();renderAdmin();toast(`Выдано ${skins.length} скинов`)}
function adminMaxProgress(){if(!ensureAdmin())return;coins=Math.max(coins,999999);materials=Math.max(materials,9999);xp=Math.max(xp,999999);seasonXp=Math.max(seasonXp,3000);opened=Math.max(opened,9999);arenaRating=Math.max(arenaRating,5000);arenaWins=Math.max(arenaWins,999);arenaMatches=Math.max(arenaMatches,999);save();localStorage.setItem('cr_arenaRating',arenaRating);localStorage.setItem('cr_arenaWins',arenaWins);localStorage.setItem('cr_arenaMatches',arenaMatches);update();renderAdmin();toast('Прогресс установлен на максимум')}
function adminClearInventory(){if(!ensureAdmin())return;if(!confirm('Очистить весь инвентарь?'))return;inv=[];totalValue=0;save();update();renderAdmin();toast('Инвентарь очищен')}
function adminExport(){if(!ensureAdmin())return;exportSave()}
function renderAdmin(){const c=document.getElementById('adminCoins'),x=document.getElementById('adminXp'),m=document.getElementById('adminMaterials'),sel=document.getElementById('adminSkinSelect'),st=document.getElementById('adminStats');if(c)c.textContent=Math.floor(coins).toLocaleString()+' ⭐';if(x)x.textContent=Math.floor(xp).toLocaleString()+' XP';if(m)m.textContent=Math.floor(materials).toLocaleString()+' материалов';if(sel&&sel.options.length!==skins.length)sel.innerHTML=skins.map((s,i)=>`<option value="${i}">${s.name} • ${s.rarity} • ${s.v} ⭐</option>`).join('');if(st)st.innerHTML=[['Скинов в инвентаре',inv.length],['Открыто кейсов',opened],['Общая ценность',Math.floor(totalValue)+' ⭐'],['Уровень',Math.floor(xp/250)+1],['Арена',arenaRating+' рейтинга']].map(a=>`<div class="admin-row"><b>${a[0]}</b><span>${a[1]}</span></div>`).join('')}


/* ===== DROP PASS ===== */
const dropPassMissions=[
 ['Первый дроп','Открой 3 кейса',()=>opened,3,3000,1000],
 ['Космический охотник','Открой 10 кейсов',()=>opened,10,3500,1000],
 ['Коллекционер','Собери 12 предметов',()=>inv.length,12,4000,1000],
 ['Богатый дроп','Набери 5000 ⭐',()=>coins,5000,4500,1000],
 ['XP-рывок','Получи 1000 XP',()=>xp,1000,5000,1000],
 ['Арена','Сыграй 3 матча',()=>arenaMatches,3,3200,1000],
 ['Мини-игры','Заработай 1000 ⭐ в мини-играх',()=>Number(localStorage.getItem('cr_minigameEarned')||0),1000,3800,1000],
 ['Легендарный момент','Получи легендарный или выше предмет',()=>inv.some(s=>['Легендарный','Мифический','Божественный'].includes(s.rarity))?1:0,1,5000,1000],
 ['Большая коллекция','Собери 25 предметов',()=>inv.length,25,4200,1000],
 ['Открывающий','Открой 25 кейсов',()=>opened,25,4600,1000],
 ['Космический ветеран','Достигни 10 уровня',level,10,4800,1000],
 ['Мастер дропа','Набери 20000 ⭐ ценности',()=>totalValue,20000,5000,1000]
];
const dropPassRewards=Array.from({length:100},(_,i)=>{
 const level=i+1;
 const coins=level===100?50000:3000+Math.floor((level-1)*47000/99);
 return {level,coins,xp:100+(i%5)*50,token:level%5===0?1:0,materials:level%3===0?4:0};
});
function dropPassLevel(){return Math.min(100,Math.floor(Number(localStorage.getItem('cr_dropPassXp')||0)/100)+1)}
function dropPassXp(){return Number(localStorage.getItem('cr_dropPassXp')||0)}
function addDropPassXp(n){if(!n||n<=0)return;localStorage.setItem('cr_dropPassXp',dropPassXp()+Math.floor(n));}
function claimDropPassMission(i){const m=dropPassMissions[i];if(!m||localStorage.getItem('dropPassMission_'+i))return;const cur=m[2]();if(cur<m[3]){toast('Задание ещё не выполнено');return}localStorage.setItem('dropPassMission_'+i,'1');coins+=m[4];gainXP(m[5]);addDropPassXp(m[5]);save();update();toast(`Drop Pass: +${m[4]} ⭐ и +${m[5]} XP`)}
function claimDropPassReward(i){const r=dropPassRewards[i];if(!r)return;const lvl=dropPassLevel();if(lvl<r.level){toast('Уровень Drop Pass ещё не достигнут');return}if(localStorage.getItem('dropPassReward_'+i)){toast('Эта награда уже получена');return}coins+=r.coins;gainXP(r.xp);if(r.token)caseTokens+=r.token;if(r.materials)materials+=r.materials;localStorage.setItem('dropPassReward_'+i,'1');save();saveShop();update();toast(`Drop Pass уровень ${r.level}: +${r.coins} ⭐ +${r.xp} XP`)}
function renderDropPass(){const gp=document.getElementById('goldPassStatus');const gb=document.getElementById('goldPassBuyBtn');if(gp)gp.textContent=goldPassOwned?'Куплен':'Не куплен';if(gb){gb.disabled=goldPassOwned;gb.textContent=goldPassOwned?'GOLD PASS АКТИВЕН':'КУПИТЬ GOLD PASS — 100 000 ⭐'}const xpv=dropPassXp(),lvl=dropPassLevel(),cur=xpv%100;const l=document.getElementById('dropPassLevel'),x=document.getElementById('dropPassXp'),t=document.getElementById('dropPassProgressText'),bar=document.getElementById('dropPassBar');if(l)l.textContent=lvl;x.textContent=xpv;t.textContent=`${cur} / 100 XP`;bar.style.width=(lvl>=100?100:cur)+'%';const mg=document.getElementById('dropPassMissionGrid');if(mg)mg.innerHTML=dropPassMissions.map((m,i)=>{const v=Math.min(m[3],Number(m[2]()||0)),done=v>=m[3],claimed=localStorage.getItem('dropPassMission_'+i);return `<div class="card mission ${done?'done':''}"><div class="rarity" style="color:${done?'#63e59a':'#b78cff'}">${done?'ГОТОВО':'DROP PASS'}</div><h3>${m[0]}</h3><div class="small">${m[1]}</div><div class="progress" style="margin-top:12px"><i style="width:${Math.min(100,v/m[3]*100)}%"></i></div><div class="pass-progress">${v}/${m[3]} • Награда: +${m[4]} ⭐ +${m[5]} XP</div><button class="btn ${done?'':'alt'}" style="margin-top:12px;width:100%;padding:10px" ${!done||claimed?'disabled':''} onclick="claimDropPassMission(${i})">${claimed?'ПОЛУЧЕНО':done?'ЗАБРАТЬ':'В ПРОЦЕССЕ'}</button></div>`}).join('');const rg=document.getElementById('dropPassRewardGrid');if(rg)rg.innerHTML=dropPassRewards.map((r,i)=>{const unlocked=lvl>=r.level,claimed=localStorage.getItem('dropPassReward_'+i);let extra=(r.token?' • 🎟️ Жетон':'')+(r.materials?' • 🧱 '+r.materials:'');return `<div class="card pass-reward ${unlocked?'':'locked'} ${claimed?'claimed':''}"><div class="pass-icon">${goldPassRewardIcon(r,i)}</div><div class="rarity" style="color:${unlocked?'#b78cff':'#6d7890'}">УРОВЕНЬ ${r.level}</div><h3>Космическая награда</h3><div class="small">+${r.coins} ⭐ • +${r.xp} XP${extra}</div><button class="btn ${unlocked?'':'alt'}" style="margin-top:12px;width:100%;padding:10px" ${!unlocked||claimed?'disabled':''} onclick="claimDropPassReward(${i})">${claimed?'ПОЛУЧЕНО':unlocked?'ЗАБРАТЬ':'ЗАКРЫТО'}</button></div>`}).join('')}
const _oldUpdate=update;update=function(){_oldUpdate();renderDropPass()};


/* ===== GOLD PASS ===== */
let goldPassOwned=localStorage.getItem('cr_goldPassOwned')==='1';
function buyGoldPass(){
  if(goldPassOwned){toast('Gold Pass уже куплен');return}
  if(coins<100000){toast('Нужно 100 000 монет');return}
  coins-=100000; goldPassOwned=true; localStorage.setItem('cr_goldPassOwned','1'); save(); update(); renderDropPass(); beep(980,.16); toast('Gold Pass куплен за 100 000 монет!');
}
function goldPassRewardIcon(r,i){
  if(i===99)return '👑'; if(r.token)return '🎟️'; if(r.materials)return '🧱'; if(r.coins>=30000)return '💰'; if(r.xp>=250)return '⚡'; return i%4===0?'💎':i%4===1?'🚀':i%4===2?'⭐':'🎁';
}

/* ===== 2D JUMP GAME ===== */
let jumpRAF=0,jumpRunning=false,jumpScore=0,jumpBest=Number(localStorage.getItem('cr_jumpBest')||0),jumpReward=0,jumpPressed=false,jumpKeys={};
const jumpCanvasReady=()=>document.getElementById('jumpCanvas');
function jumpPress(v){jumpPressed=v;if(v && jumpRunning) jumpPlayer.vy=-10;}
function startJumpGame(){
 const c=jumpCanvasReady(); if(!c)return; cancelAnimationFrame(jumpRAF); jumpRunning=true;jumpScore=0;jumpReward=0;jumpKeys={};
 const ctx=c.getContext('2d'),W=c.width,H=c.height;
 let player={x:90,y:H-100,w:28,h:42,vy:0,on:false};
 let platforms=[{x:0,y:H-28,w:W,h:28},{x:150,y:320,w:150,h:16},{x:360,y:255,w:150,h:16},{x:570,y:185,w:150,h:16},{x:770,y:120,w:100,h:16}];
 let stars=[{x:205,y:285},{x:420,y:220},{x:625,y:150},{x:805,y:85}]; let scroll=0; let last=performance.now();
 const loop=(now)=>{if(!jumpRunning)return; const dt=Math.min(.032,(now-last)/1000);last=now;
   if(jumpKeys.ArrowLeft)player.x-=220*dt;if(jumpKeys.ArrowRight)player.x+=220*dt;
   player.vy+=24*dt;player.y+=player.vy*dt;player.on=false;
   if((jumpKeys[' ']||jumpPressed)&&player.y>H-180){player.vy=-10;jumpKeys[' ']=false;jumpPressed=false}
   for(const p of platforms){if(player.vy>=0&&player.x+player.w>p.x&&player.x<p.x+p.w&&player.y+player.h>=p.y&&player.y+player.h<=p.y+22){player.y=p.y-player.h;player.vy=0;player.on=true}}
   for(let i=stars.length-1;i>=0;i--){const st=stars[i];if(Math.hypot(player.x+player.w/2-st.x,player.y+player.h/2-st.y)<28){stars.splice(i,1);jumpScore++;}}
   if(player.x>W-120){player.x=120;scroll+=220;jumpScore+=2;}
   if(player.y>H+80){endJumpGame();return}
   if(jumpScore>jumpBest)jumpBest=jumpScore;
   ctx.clearRect(0,0,W,H);let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#12092a');g.addColorStop(1,'#05030d');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
   for(let i=0;i<55;i++){ctx.fillStyle=i%7===0?'#ffffff':'#8e68ff';ctx.globalAlpha=.25+(i%5)/10;ctx.fillRect((i*83-scroll*.18)%W,(i*47)%H,2,2)}ctx.globalAlpha=1;
   for(const p of platforms){ctx.fillStyle='#7f54ff';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle='#c4a9ff';ctx.fillRect(p.x,p.y,p.w,3)}
   for(const st of stars){ctx.fillStyle='#ffd45c';ctx.beginPath();ctx.arc(st.x,st.y,8,0,Math.PI*2);ctx.fill()}
   ctx.fillStyle='#5ce1ff';ctx.fillRect(player.x,player.y,player.w,player.h);ctx.fillStyle='#dff9ff';ctx.fillRect(player.x+7,player.y+8,5,5);ctx.fillRect(player.x+17,player.y+8,5,5);
   document.getElementById('jumpScore').textContent=jumpScore;document.getElementById('jumpBest').textContent=jumpBest;document.getElementById('jumpReward').textContent=jumpReward; jumpRAF=requestAnimationFrame(loop);
 }; requestAnimationFrame(loop);
}
function endJumpGame(){jumpRunning=false;cancelAnimationFrame(jumpRAF);const reward=Math.min(5000,500+jumpScore*250);jumpReward=reward;coins+=reward;gainXP(Math.min(1000,100+jumpScore*40));localStorage.setItem('cr_jumpBest',jumpBest);save();update();renderDropPass();const m=document.getElementById('jumpMessage');if(m)m.textContent=`Раунд окончен! +${reward} монет и XP за результат ${jumpScore}.`;toast(`Прыжок: +${reward} монет`)}
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();jumpKeys[e.key]=true;if(e.key===' '&&jumpRunning)jumpPressed=true});window.addEventListener('keyup',e=>{jumpKeys[e.key]=false});

dailyCheck();update();renderArena();document.body.classList.add("menu-red");document.getElementById("overdriveSwitch").classList.toggle("on",overdrive);document.getElementById("soundSwitch").classList.toggle("on",soundOn);renderAdmin();

/* ===== CASE BATTLE (LOCAL LAN WEBSOCKET) ===== */
let lanWS=null, lanRoom='', lanPlayer=0, lanIsHost=false, lanMaxPlayers=2, lanSelectedCase=0, lanRound=0, lanResults={}, lanStarted=false, lanServerAddr='', lanPendingAction=null, lanConnectToken=0;
function lanSetStatus(t){const e=document.getElementById('lanStatus');if(e)e.textContent=t}
function lanMsg(t){const e=document.getElementById('lanMessage');if(e)e.textContent=t;const l=document.getElementById('lanBattleLog');if(l)l.textContent=t}
function lanServerDefault(){
  // Online build: the backend is hosted on the same HTTPS site.
  // No local server address is requested from players.
  if(!location.host)return '';
  const proto=location.protocol==='https:'?'wss:':'ws:';
  return `${proto}//${location.host}/ws`;
}
function lanInviteUrl(code=lanRoom){
  if(!code || !location.href)return '';
  const u=new URL(location.href);
  u.hash='case-battle='+encodeURIComponent(code);
  return u.toString();
}
async function lanCopyInvite(){
  const code=lanRoom || (document.getElementById('lanRoomInput')?.value||'').trim().toUpperCase();
  if(!code)return toast('Сначала создай или введи комнату');
  const url=lanInviteUrl(code);
  try{await navigator.clipboard.writeText(url);toast('Ссылка на комнату скопирована');}
  catch(e){prompt('Скопируй ссылку на комнату:',url);}
}
function lanHandleInvite(){
  try{
    const raw=location.hash||'';
    const m=raw.match(/^#case-battle=([^&]+)/);
    if(!m)return;
    const code=decodeURIComponent(m[1]).toUpperCase();
    const input=document.getElementById('lanRoomInput');
    if(input)input.value=code;
    // Wait for the page/game initialization, then connect and join.
    setTimeout(()=>{lanJoinRoom();},700);
  }catch(e){}
}
function lanRoomCode(){return lanRoom}
function lanSend(m){try{if(lanWS&&lanWS.readyState===WebSocket.OPEN)lanWS.send(JSON.stringify(m))}catch(e){}}
function lanCloseSocket(){try{if(lanWS){lanWS.onclose=null;lanWS.close()}}catch(e){}lanWS=null}
function lanResetState(){lanCloseSocket();lanRoom='';lanPlayer=0;lanIsHost=false;lanStarted=false;lanResults={};lanSetStatus('ОФЛАЙН');const r=document.getElementById('lanRoomText');if(r)r.textContent='Нет комнаты';const i=document.getElementById('lanRoomInput');if(i)i.value='';lanUpdatePlayers();lanRenderResults()}
function lanConnectServer(onReady){
  const addr=lanServerDefault();
  if(!addr){toast('Укажи адрес LAN-сервера');return false}
  if(lanWS && lanWS.readyState===WebSocket.OPEN){if(onReady)onReady();return true}
  if(lanWS && lanWS.readyState===WebSocket.CONNECTING){if(onReady)lanPendingAction=onReady;return true}
  lanCloseSocket(); lanServerAddr=addr; lanSetStatus('ПОДКЛЮЧЕНИЕ…'); lanMsg('Подключаемся к LAN-серверу…');
  const token=++lanConnectToken;
  try{lanWS=new WebSocket(addr)}catch(e){lanSetStatus('ОШИБКА');lanMsg('Неверный адрес сервера.');return false}
  const ws=lanWS;
  ws.onopen=()=>{
    if(token!==lanConnectToken || ws!==lanWS)return;
    lanSetStatus('ОНЛАЙН');lanMsg('Сервер подключён.');lanSend({type:'auth',token:mdToken()});lanUpdatePlayers();
    const action=lanPendingAction;lanPendingAction=null;if(action)action();
  };
  ws.onmessage=e=>{try{lanHandleServer(JSON.parse(e.data))}catch(err){console.error(err)}};
  ws.onerror=()=>{if(token!==lanConnectToken || ws!==lanWS)return;lanSetStatus('ОШИБКА');lanMsg('Не удалось подключиться. Проверь, что открыта опубликованная HTTPS-версия игры.')};
  ws.onclose=()=>{if(token!==lanConnectToken || ws!==lanWS)return;lanSetStatus('ОФЛАЙН');lanMsg('Связь с LAN-сервером потеряна.')};
  return true;
}
function lanCreateRoom(){
  const create=()=>{
    if(!lanWS||lanWS.readyState!==WebSocket.OPEN){lanMsg('Ждём подключения к LAN-серверу…');return}
    lanIsHost=true;lanPlayer=1;lanMaxPlayers=Number(document.getElementById('lanMaxPlayers')?.value)||2;lanStarted=false;lanResults={};
    lanSetStatus('СОЗДАНИЕ…');lanMsg('Создаём комнату…');
    lanSend({type:'create',maxPlayers:lanMaxPlayers,caseIndex:lanSelectedCase});
  };
  if(!lanWS||lanWS.readyState!==WebSocket.OPEN){lanPendingAction=create;lanConnectServer();return}
  create();
}
function lanJoinRoom(){
  const code=(document.getElementById('lanRoomInput')?.value||'').trim().toUpperCase();
  if(!code)return toast('Введи код комнаты');
  const join=()=>{
    if(!lanWS||lanWS.readyState!==WebSocket.OPEN){lanMsg('Ждём подключения к LAN-серверу…');return}
    lanIsHost=false;lanPlayer=0;lanStarted=false;lanResults={};lanSend({type:'join',room:code});lanSetStatus('ВХОД…');lanMsg('Подключаемся к комнате…');
  };
  if(!lanWS||lanWS.readyState!==WebSocket.OPEN){lanPendingAction=join;lanConnectServer();return}
  join();
}
function lanDisconnect(){if(lanWS&&lanWS.readyState===WebSocket.OPEN)lanSend({type:'leave'});lanResetState();lanSetStatus('ОФЛАЙН');lanMsg('Подключись к LAN-серверу, чтобы играть.')}
function lanRenderCases(){const g=document.getElementById('lanCaseGrid');if(!g)return;g.innerHTML=cases.map((c,i)=>`<div class="card case-card" style="--glow:${c.glow};--accent:${c.accent};cursor:pointer" onclick="lanSelectCase(${i})"><div class="case-art"><img class="case-avatar" src="${c.avatar}" alt="Аватар кейса"><div class="case-box">CASE</div></div><div class="rarity" style="color:${c.accent}">CASE ${i+1}</div><div class="name">${c.name}</div><div class="small">🔫 ${c.weapon}</div><div class="case-price"><b>${Number(c.price).toLocaleString('ru-RU')} ⭐</b><span>Выбрать →</span></div></div>`).join('')}
function lanRenderResults(){const g=document.getElementById('lanResultsGrid');if(!g)return;const rows=Object.values(lanResults).sort((a,b)=>b.value-a.value);g.innerHTML=rows.length?rows.map((r,i)=>`<div class="card fighter"><div class="small">${i===0?'🏆 ':''}ИГРОК ${r.player}</div><h3>${r.name||'—'}</h3><div class="value">${Math.round(r.value||0).toLocaleString('ru-RU')} ⭐</div><div class="small">${r.rarity||''}</div></div>`).join(''):`<div class="small">Результаты появятся после открытия кейса.</div>`}
function lanUpdatePlayers(){const e=document.getElementById('lanPlayers');if(e){const n=e.dataset.count||'0',m=lanMaxPlayers;e.textContent=`${n} / ${m}`}const b=document.getElementById('lanStartBtn');if(b)b.disabled=!(lanIsHost && Number(document.getElementById('lanPlayers')?.dataset.count||0)>=2 && !lanStarted);const sel=document.getElementById('lanMaxPlayers');if(sel){sel.value=String(lanMaxPlayers);sel.disabled=!lanIsHost||lanStarted}}
function lanSetPlayersCount(n){const e=document.getElementById('lanPlayers');if(e)e.dataset.count=String(n);lanUpdatePlayers()}
function lanSetMaxPlayers(v){if(!lanIsHost||lanStarted)return;lanMaxPlayers=Math.max(2,Math.min(6,Number(v)||2));lanSend({type:'config',maxPlayers:lanMaxPlayers});lanUpdatePlayers();lanMsg(`Лимит комнаты: ${lanMaxPlayers} игроков.`)}
function lanSelectCase(i){if(!lanIsHost||lanStarted)return toast('Только хост выбирает кейс до начала раунда');lanSelectedCase=i;const c=cases[i];const e=document.getElementById('lanSelectedCase');if(e)e.textContent=c.name;document.querySelectorAll('#lanCaseGrid .case-card').forEach((x,n)=>x.style.outline=n===i?'2px solid #c77cff':'none');lanSend({type:'case',caseIndex:i})}
function lanStartBattle(){if(!lanIsHost)return toast('Только хост может начать батл');const players=Number(document.getElementById('lanPlayers')?.dataset.count||0);if(players<2)return toast('Нужен хотя бы ещё один игрок');if(lanStarted)return;const c=cases[lanSelectedCase];if(!c)return;lanStarted=true;lanRound=Date.now();lanResults={};lanResults[1]={pending:true,player:1};lanSend({type:'start',caseIndex:lanSelectedCase,round:lanRound});setTimeout(()=>lanOpenBattleCase(c),450);lanUpdatePlayers()}
function lanOpenBattleCase(c){
  const old=selectedCase;selectedCase=cases.indexOf(c);const skin=pick();selectedCase=old;
  const value=valueForCase(skin,c);inv.push({...skin,value,caseName:c.name,weapon:c.weapon,obtainedAt:Date.now()});totalValue+=value;opened++;coins+=Math.floor(value*.08);gainXP(Math.max(10,Math.floor(value/20)));save();update();
  lanSend({type:'result',round:lanRound,value,name:skin.name,rarity:skin.rarity});
}
function lanHandleServer(m){
  if(!m||typeof m!=='object')return;
  if(m.type==='error'){lanSetStatus('ОШИБКА');lanMsg(m.message||'Ошибка сервера.');return}
  if(m.type==='serverReady'){lanSetStatus('ОНЛАЙН');return}
  if(m.type==='created'){
    lanIsHost=true;lanPlayer=1;lanRoom=m.room;lanMaxPlayers=m.maxPlayers||2;lanSelectedCase=m.caseIndex??0;lanSetPlayersCount(1);lanSetStatus('КОМНАТА ГОТОВА');
    const rt=document.getElementById('lanRoomText');if(rt)rt.textContent='Комната '+lanRoom;const ri=document.getElementById('lanRoomInput');if(ri)ri.value=lanRoom;const sc=document.getElementById('lanSelectedCase');if(sc)sc.textContent=cases[lanSelectedCase]?.name||'Не выбран';lanMsg(`Код комнаты ${lanRoom}. Отправь код или ссылку другу.`);return;
  }
  if(m.type==='joined'){
    lanIsHost=false;lanPlayer=m.player;lanRoom=m.room;lanMaxPlayers=m.maxPlayers||2;lanSelectedCase=m.caseIndex??0;lanSetPlayersCount(m.count||2);lanSetStatus('В КОМНАТЕ');
    const rt=document.getElementById('lanRoomText');if(rt)rt.textContent='Комната '+lanRoom;const sc=document.getElementById('lanSelectedCase');if(sc)sc.textContent=cases[lanSelectedCase]?.name||'Не выбран';lanMsg('Ты подключился к комнате. Жди начала батла.');return;
  }
  if(m.type==='players'){lanMaxPlayers=m.maxPlayers||lanMaxPlayers;lanSetPlayersCount(m.count||0);return}
  if(m.type==='config'){lanMaxPlayers=Math.min(6,Math.max(2,m.maxPlayers||2));lanUpdatePlayers();return}
  if(m.type==='case'){lanSelectedCase=m.caseIndex;const sc=document.getElementById('lanSelectedCase');if(sc)sc.textContent=cases[m.caseIndex]?.name||'Не выбран';document.querySelectorAll('#lanCaseGrid .case-card').forEach((x,n)=>x.style.outline=n===lanSelectedCase?'2px solid #c77cff':'none');return}
  if(m.type==='start'){lanRound=m.round;lanStarted=true;lanResults={};lanRenderResults();lanSelectedCase=m.caseIndex;const c=cases[m.caseIndex];const sc=document.getElementById('lanSelectedCase');if(sc)sc.textContent=c.name;lanMsg('Раунд начался! Открываем '+c.name+'…');setTimeout(()=>lanOpenBattleCase(c),450);return}
  if(m.type==='results'){
    lanResults=m.results||{};lanRenderResults();lanStarted=false;lanUpdatePlayers();
    const mine=lanResults[lanPlayer]; if(mine){const best=Math.max(...Object.values(lanResults).map(x=>Number(x.value)||0));lanMsg((mine.value===best?'🏆 ТЫ ПОБЕДИЛ!':'Раунд завершён.')+' Твой дроп: '+mine.name+'.');}
    return;
  }
  if(m.type==='you'){lanPlayer=m.player;return}
}

/* Online room bootstrap: connect automatically and accept #case-battle=CODE links. */
window.addEventListener('load',()=>{
  setTimeout(()=>{try{lanConnectServer();lanHandleInvite();}catch(e){}},500);
});
\n/* ===== ARCADE+ MAX PACK ===== */
const arcadeState=JSON.parse(localStorage.getItem('cr_arcadeState')||'null')||{
  points:0,plays:0,wins:0,comboBest:0,
  records:{grid:0,color:0,typing:0,vault:0,orbital:0,meteor:0},
  daily:{day:'',goal:3,progress:0,claimed:false}
};
function saveArcade(){localStorage.setItem('cr_arcadeState',JSON.stringify(arcadeState))}
function arcadeFinish(type,score,win=true){
  score=Math.max(0,Math.floor(Number(score)||0));
  arcadeState.plays++;
  if(win)arcadeState.wins++;
  arcadeState.points+=score;
  arcadeState.records[type]=Math.max(arcadeState.records[type]||0,score);
  arcadeState.comboBest=Math.max(arcadeState.comboBest,arcadeComboTemp||0);
  const reward=Math.max(10,Math.floor(score*.7)+25);
  coins+=reward;gainXP(Math.max(8,Math.floor(score*.35)+12));seasonXp+=Math.max(5,Math.floor(score*.4));
  arcadeState.daily.progress=Math.min(arcadeState.daily.goal,arcadeState.daily.progress+1);
  saveArcade();save();update();toast(`🚀 Arcade+: +${reward} ⭐`);
}
function ensureArcadeDaily(){
  const d=novaDay();
  if(!arcadeState.daily||arcadeState.daily.day!==d){
    const goals=[
      ['Аркадный разогрев','Заверши 3 любые игры',3],
      ['Комбо-мастер','Заверши 4 любые игры',4],
      ['Шесть из шести','Заверши 6 любых игр',6]
    ];
    const g=goals[(new Date().getDate()+new Date().getMonth())%goals.length];
    arcadeState.daily={day:d,title:g[0],desc:g[1],goal:g[2],progress:0,claimed:false};
    saveArcade();
  }
}
function claimArcadeDaily(){
  ensureArcadeDaily();
  if(arcadeState.daily.claimed||arcadeState.daily.progress<arcadeState.daily.goal)return;
  arcadeState.daily.claimed=true;coins+=300;gainXP(180);seasonXp+=120;saveArcade();update();toast('🏆 Аркадный день завершён: +300 ⭐');
}
function renderArcade(){
  ensureArcadeDaily();
  const s=arcadeState;
  ['arcadePoints','arcadePlays','arcadeWins','arcadeComboBest'].forEach((id,i)=>{const e=document.getElementById(id);if(e)e.textContent=[s.points,s.plays,s.wins,s.comboBest][i]});
  const d=s.daily;
  const t=document.getElementById('arcadeDailyTitle');if(t)t.textContent=d.title||'Аркадный день';
  const de=document.getElementById('arcadeDailyDesc');if(de)de.textContent=d.desc||'Заверши несколько игр.';
  const p=document.getElementById('arcadeDailyProgress');if(p)p.textContent=`${Math.min(d.progress,d.goal)} / ${d.goal}`;
  const bar=document.getElementById('arcadeDailyBar');if(bar)bar.style.width=Math.min(100,d.progress/d.goal*100)+'%';
  const b=document.getElementById('arcadeDailyClaim');if(b){b.disabled=d.claimed||d.progress<d.goal;b.textContent=d.claimed?'ПОЛУЧЕНО':(d.progress>=d.goal?'ЗАБРАТЬ':'В ПРОЦЕССЕ')}
  const rec=[
    ['🎯','GRID HUNT',s.records.grid],
    ['🌈','COLOR CLASH',s.records.color],
    ['⌨️','TYPING RUSH',s.records.typing],
    ['🧠','NUMBER VAULT',s.records.vault],
    ['🪐','ORBITAL COMBO',s.records.orbital],
    ['☄️','METEOR RUN',s.records.meteor]
  ];
  const r=document.getElementById('arcadeRecords');
  if(r)r.innerHTML=rec.map(x=>`<div class="card arcade-record"><div class="rarity">${x[0]} ${x[1]}</div><div class="record-score">${x[2]||0}</div><div class="small">Лучший результат</div></div>`).join('');
}

/* Grid Hunt */
let gridHuntActive=false,gridHuntScore=0,gridHuntTime=20,gridHuntTimer=null;
function startGridHunt(){
  if(gridHuntActive)return;gridHuntActive=true;gridHuntScore=0;gridHuntTime=20;
  const b=document.getElementById('gridHuntBoard');if(!b)return;
  const msg=document.getElementById('gridHuntMsg');msg.textContent='Ищи голубую клетку!';
  clearInterval(gridHuntTimer);gridHuntRound();
  gridHuntTimer=setInterval(()=>{gridHuntTime--;document.getElementById('gridHuntTime').textContent=gridHuntTime;if(gridHuntTime<=0)endGridHunt()},1000)
}
function gridHuntRound(){
  if(!gridHuntActive)return;const b=document.getElementById('gridHuntBoard');b.innerHTML='';
  const target=Math.floor(Math.random()*16);
  for(let i=0;i<16;i++){const x=document.createElement('button');x.className='hunt-cell';x.textContent='•';if(i===target)x.classList.add('target');x.onclick=()=>{if(!gridHuntActive)return;if(i===target){gridHuntScore++;document.getElementById('gridHuntScore').textContent=gridHuntScore;beep(760,.025);gridHuntRound()}else{gridHuntScore=Math.max(0,gridHuntScore-1);document.getElementById('gridHuntScore').textContent=gridHuntScore;x.classList.add('shake')}};b.appendChild(x)}
}
function endGridHunt(){if(!gridHuntActive)return;gridHuntActive=false;clearInterval(gridHuntTimer);const rewardScore=gridHuntScore*18;document.getElementById('gridHuntMsg').textContent=`Финиш: ${gridHuntScore} целей • +${rewardScore+25} ⭐`;arcadeFinish('grid',gridHuntScore,true)}

/* Color Clash */
const clashColors=[['КРАСНЫЙ','#ff536d'],['СИНИЙ','#58b9ff'],['ЗЕЛЁНЫЙ','#70f3ad'],['ЖЁЛТЫЙ','#ffd45c']];
let clashActive=false,clashScore=0,clashTime=20,clashTimer=null,clashAnswer=0;
function renderClashButtons(){
 const box=document.getElementById('colorClashButtons');if(!box)return;
 box.innerHTML=clashColors.map((c,i)=>`<button class="color-btn" style="color:${c[1]}" onclick="colorClashPick(${i})">${c[0]}</button>`).join('')
}
function startColorClash(){if(clashActive)return;clashActive=true;clashScore=0;clashTime=20;renderClashButtons();newClashRound();clearInterval(clashTimer);clashTimer=setInterval(()=>{clashTime--;document.getElementById('colorClashTime').textContent=clashTime;if(clashTime<=0)endColorClash()},1000)}
function newClashRound(){if(!clashActive)return;clashAnswer=Math.floor(Math.random()*clashColors.length);const ink=Math.floor(Math.random()*clashColors.length);const w=document.getElementById('colorClashWord');w.textContent=clashColors[clashAnswer][0];w.style.color=clashColors[ink][1]}
function colorClashPick(i){if(!clashActive)return;if(i===clashAnswer){clashScore++;beep(680,.025);newClashRound()}else{clashScore=Math.max(0,clashScore-1);document.getElementById('colorClashMsg').textContent='Промах! Смотри на слово, а не на цвет свечения.';newClashRound()}document.getElementById('colorClashScore').textContent=clashScore}
function endColorClash(){if(!clashActive)return;clashActive=false;clearInterval(clashTimer);document.getElementById('colorClashMsg').textContent=`Результат: ${clashScore}`;arcadeFinish('color',clashScore,true)}

/* Typing Rush */
const typingPhrases=['космический дроп','моя легендарная коллекция','неоновый охотник','mishadrop nova','аркадный чемпион','квантовый импульс','золотой портал','победа в арене','быстрый коллекционер','пиксельный рывок'];
let typingActive=false,typingScore=0,typingTime=30,typingTimer=null,typingCurrent='';
function startTypingRush(){
 if(typingActive)return;typingActive=true;typingScore=0;typingTime=30;document.getElementById('typingInput').value='';document.getElementById('typingInput').focus();nextTypingPhrase();
 clearInterval(typingTimer);typingTimer=setInterval(()=>{typingTime--;document.getElementById('typingTime').textContent=typingTime;if(typingTime<=0)endTypingRush()},1000)
}
function nextTypingPhrase(){typingCurrent=typingPhrases[Math.floor(Math.random()*typingPhrases.length)];document.getElementById('typingTarget').textContent=typingCurrent}
function typingSubmit(){if(!typingActive)return;const v=document.getElementById('typingInput').value.trim().toLowerCase();if(v===typingCurrent.toLowerCase()){typingScore++;document.getElementById('typingScore').textContent=typingScore;document.getElementById('typingMsg').textContent='Точно! Следующая фраза.';document.getElementById('typingInput').value='';beep(720,.025);nextTypingPhrase()}else if(v){document.getElementById('typingMsg').textContent='Не совпало — попробуй ещё раз.'}}
function endTypingRush(){if(!typingActive)return;typingActive=false;clearInterval(typingTimer);document.getElementById('typingMsg').textContent=`Напечатано правильно: ${typingScore}`;arcadeFinish('typing',typingScore,true)}

/* Number Vault */
let vaultActive=false,vaultLevel=1,vaultBest=Number(localStorage.getItem('cr_vaultBest')||0),vaultCode='';
function startNumberVault(){vaultActive=true;vaultLevel=1;document.getElementById('numberVaultLevel').textContent=vaultLevel;nextVault()}
function nextVault(){if(!vaultActive)return;const len=Math.min(8,3+vaultLevel);vaultCode=String(Math.floor(Math.random()*Math.pow(10,len))).padStart(len,'0');const e=document.getElementById('numberVaultCode');e.textContent=vaultCode;document.getElementById('numberVaultInput').value='';document.getElementById('numberVaultMsg').textContent='Запоминай! Код исчезнет через 1.2 секунды.';setTimeout(()=>{if(vaultActive){e.textContent='•'.repeat(len);document.getElementById('numberVaultInput').focus()}},1200)}
function submitNumberVault(){if(!vaultActive)return;const v=document.getElementById('numberVaultInput').value;if(v===vaultCode){vaultBest=Math.max(vaultBest,vaultLevel);localStorage.setItem('cr_vaultBest',vaultBest);document.getElementById('numberVaultBest').textContent=vaultBest;vaultLevel++;document.getElementById('numberVaultLevel').textContent=vaultLevel;coins+=20+vaultLevel*5;gainXP(12+vaultLevel*2);seasonXp+=10;save();nextVault()}else{vaultActive=false;const score=Math.max(0,vaultLevel-1);document.getElementById('numberVaultMsg').textContent=`Сейф закрыт. Пройдено уровней: ${score}`;arcadeFinish('vault',score,true)}}

/* Orbital Combo */
let orbitalActive=false,orbitalScore=0,orbitalComboTemp=0,orbitalTime=20,orbitalTimer=null,orbitalNode=null;
function startOrbitalCombo(){if(orbitalActive)return;orbitalActive=true;orbitalScore=0;orbitalComboTemp=0;orbitalTime=20;document.getElementById('orbitalScore').textContent=0;document.getElementById('orbitalCombo').textContent=0;document.getElementById('orbitalMsg').textContent='Лови сферу!';clearInterval(orbitalTimer);spawnOrb();orbitalTimer=setInterval(()=>{orbitalTime--;document.getElementById('orbitalTime').textContent=orbitalTime;if(orbitalTime<=0)endOrbital()},1000)}
function spawnOrb(){if(!orbitalActive)return;const a=document.getElementById('orbitalArea');a.innerHTML='';const o=document.createElement('button');o.className='orb';o.style.left=(4+Math.random()*84)+'%';o.style.top=(8+Math.random()*70)+'%';o.onclick=()=>{if(!orbitalActive)return;orbitalComboTemp++;orbitalScore+=10+Math.min(40,orbitalComboTemp*2);document.getElementById('orbitalScore').textContent=orbitalScore;document.getElementById('orbitalCombo').textContent=orbitalComboTemp;beep(780,.02);spawnOrb()};a.appendChild(o);orbitalNode=o}
function endOrbital(){if(!orbitalActive)return;orbitalActive=false;clearInterval(orbitalTimer);if(orbitalNode)orbitalNode.remove();document.getElementById('orbitalMsg').textContent=`Финиш: ${orbitalScore} очков`;arcadeFinish('orbital',orbitalScore,true)}

/* Meteor Run */
let meteorActive=false,meteorScore=0,meteorTime=20,meteorTimer=null,meteorSpawner=null;
function startMeteorRun(){if(meteorActive)return;meteorActive=true;meteorScore=0;meteorTime=20;document.getElementById('meteorScore').textContent=0;document.getElementById('meteorTime').textContent=20;document.getElementById('meteorMsg').textContent='Зелёные +1, красные −2.';const a=document.getElementById('meteorArea');a.innerHTML='';clearInterval(meteorTimer);clearInterval(meteorSpawner);meteorSpawner=setInterval(spawnMeteor,450);meteorTimer=setInterval(()=>{meteorTime--;document.getElementById('meteorTime').textContent=meteorTime;if(meteorTime<=0)endMeteorRun()},1000);spawnMeteor()}
function spawnMeteor(){if(!meteorActive)return;const a=document.getElementById('meteorArea');const x=document.createElement('button');const good=Math.random()<.65;x.className='meteor '+(good?'good':'bad');x.textContent=good?'✦':'✹';x.style.left=(3+Math.random()*88)+'%';x.style.top=(5+Math.random()*76)+'%';x.onclick=()=>{if(!meteorActive)return;meteorScore+=good?1:-2;meteorScore=Math.max(0,meteorScore);document.getElementById('meteorScore').textContent=meteorScore;x.remove()};a.appendChild(x);setTimeout(()=>x.remove(),900)}
function endMeteorRun(){if(!meteorActive)return;meteorActive=false;clearInterval(meteorTimer);clearInterval(meteorSpawner);document.getElementById('meteorMsg').textContent=`Финиш: ${meteorScore} очков`;arcadeFinish('meteor',meteorScore,true)}

/* ===== NOVA HUB MAX ===== */
const novaState=JSON.parse(localStorage.getItem('cr_novaHub')||'null')||{day:'',points:0,events:0,streak:0,jackpots:0,treasures:0,spinDay:'',questDay:'',questClaimed:false,bossHp:10,bossHits:0,treasureMap:[],treasureOpen:[],treasureFound:0};
function novaDay(){return new Date().toISOString().slice(0,10)}
function saveNova(){localStorage.setItem('cr_novaHub',JSON.stringify(novaState))}
function novaReward(coinsAdd,xpAdd,pointsAdd=0){coins+=coinsAdd;gainXP(xpAdd);seasonXp+=Math.max(0,Math.floor(xpAdd/2));novaState.points+=pointsAdd;save();saveNova();update()}
function novaResetDay(){const d=novaDay();if(novaState.day!==d){novaState.day=d;novaState.spinDay='';novaState.questDay=d;novaState.questClaimed=false;novaState.streak=0;saveNova()}if(!novaState.questDay){novaState.questDay=d;saveNova()}}
function novaSpin(){novaResetDay();if(novaState.spinDay===novaDay())return toast('🎡 Бесплатный спин уже использован сегодня');const rewards=[50,100,150,250,400,700];const idx=Math.floor(Math.random()*rewards.length);const amount=rewards[idx];novaState.spinDay=novaDay();novaState.events++;novaState.streak++;const wheel=document.getElementById('novaWheel');if(wheel){wheel.style.transform=`rotate(${1080+idx*60}deg)`}setTimeout(()=>{novaReward(amount,35,amount);const m=document.getElementById('novaSpinMsg');if(m)m.textContent=`🎉 Выпало ${amount} ⭐! Возвращайся завтра.`},650);const b=document.getElementById('novaSpinBtn');if(b)b.disabled=true;saveNova();renderNovaHub()}
function novaDice(){const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6),sum=a+b;document.getElementById('novaDie1').textContent=a;document.getElementById('novaDie2').textContent=b;novaState.events++;novaState.streak++;let reward=sum===12?1500:sum>=10?500:sum>=7?120:25;if(sum===12){novaState.jackpots++;toast('💎 JACKPOT! Двойная шестёрка!')}novaReward(reward,25+sum*3,sum*10);document.getElementById('novaDiceMsg').textContent=`Сумма ${sum} → +${reward} ⭐`}
function novaBossHit(){if(novaState.bossHp<=0){novaState.bossHp=10;novaState.bossHits=0}const dmg=1+Math.floor(Math.random()*3);novaState.bossHp=Math.max(0,novaState.bossHp-dmg);novaState.bossHits++;novaState.events++;const reward=15+dmg*12+Math.min(150,novaState.bossHits*5);novaReward(reward,10,damageScore(dmg));document.getElementById('novaBossBar').style.width=(novaState.bossHp/10*100)+'%';document.getElementById('novaBossMsg').textContent=`Урон ${dmg}. HP босса: ${novaState.bossHp}/10`;if(novaState.bossHp===0){const bonus=500+novaState.bossHits*25;novaState.jackpots++;novaReward(bonus,120,500);document.getElementById('novaBossIcon').textContent='💥';document.getElementById('novaBossMsg').textContent=`BOSS DEFEATED! Бонус +${bonus} ⭐`;setTimeout(()=>{novaState.bossHp=10;novaState.bossHits=0;document.getElementById('novaBossIcon').textContent='👾';document.getElementById('novaBossBar').style.width='100%';saveNova();renderNovaHub()},900)}}
function damageScore(n){return n*10}
function novaNewTreasure(){novaState.treasureMap=[];while(novaState.treasureMap.length<3){const n=Math.floor(Math.random()*25);if(!novaState.treasureMap.includes(n))novaState.treasureMap.push(n)}novaState.treasureOpen=[];novaState.treasureFound=0;novaState.events++;saveNova();renderNovaTreasure()}
function novaTreasurePick(i){if(novaState.treasureOpen.includes(i))return;novaState.treasureOpen.push(i);if(novaState.treasureMap.includes(i)){novaState.treasureFound++;novaState.treasures++;const reward=100+novaState.treasureFound*75;novaReward(reward,35,reward);toast(`🗺️ Сундук найден: +${reward} ⭐`)}else{novaState.points+=5;document.getElementById('novaTreasureMsg').textContent='Пустая клетка… ищи дальше.'}saveNova();renderNovaTreasure();if(novaState.treasureFound>=3){document.getElementById('novaTreasureMsg').textContent='🏆 Карта полностью разгадана!';}}
function renderNovaTreasure(){const g=document.getElementById('novaTreasureGrid');if(!g)return;g.innerHTML=Array.from({length:25},(_,i)=>{const open=novaState.treasureOpen.includes(i),found=open&&novaState.treasureMap.includes(i);return `<button class="treasure-cell ${open?'open':''}" onclick="novaTreasurePick(${i})">${open?(found?'💎':'·'):'?'}</button>`}).join('');const m=document.getElementById('novaTreasureMsg');if(m)m.textContent=`Найди 3 сундука из 25 клеток. Найдено: ${novaState.treasureFound}/3`}
function novaQuestData(){const plays=(typeof arcadeState!=='undefined'?arcadeState.plays:0);return [['Кейсер','Открой 3 кейса',Math.min(3,opened),3,250],['Аркадист','Сыграй 5 аркадных игр',Math.min(5,plays),5,300],['Коллекционер','Имей 10 предметов',Math.min(10,inv.length),10,350]]}
function renderNovaQuests(){novaResetDay();const q=novaQuestData(),list=document.getElementById('novaQuestList');if(!list)return;list.innerHTML=q.map(x=>`<div class="nova-quest-row"><div><b>${x[0]}</b><div class="small">${x[1]}</div><div class="progress" style="margin-top:7px"><i style="width:${x[3]?Math.min(100,x[2]/x[3]*100):0}%"></i></div></div><b>${x[2]}/${x[3]}</b></div>`).join('');const reward=q.reduce((a,x)=>a+x[4],0);document.getElementById('novaQuestReward').textContent='+'+reward+' ⭐';const done=q.every(x=>x[2]>=x[3]);const btn=document.getElementById('novaQuestClaim');btn.disabled=!done||novaState.questClaimed;btn.textContent=novaState.questClaimed?'ПОЛУЧЕНО':done?'ЗАБРАТЬ':'В ПРОЦЕССЕ'}
function novaClaimQuestChain(){novaResetDay();if(novaState.questClaimed)return;const q=novaQuestData();if(!q.every(x=>x[2]>=x[3]))return toast('📜 Выполни всю цепочку NOVA');const reward=q.reduce((a,x)=>a+x[4],0)+250;novaState.questClaimed=true;novaState.streak++;novaReward(reward,160,reward);toast(`📜 Цепочка завершена: +${reward} ⭐`);renderNovaQuests()}
function renderNovaHub(){novaResetDay();const ids=['novaPoints','novaEvents','novaStreak','novaJackpots','novaTreasures'];const vals=[novaState.points,novaState.events,novaState.streak,novaState.jackpots,novaState.treasures];ids.forEach((id,i)=>{const e=document.getElementById(id);if(e)e.textContent=vals[i].toLocaleString('ru-RU')});const b=document.getElementById('novaSpinBtn');if(b)b.disabled=novaState.spinDay===novaDay();if(novaState.spinDay===novaDay()){const m=document.getElementById('novaSpinMsg');if(m)m.textContent='Сегодняшний спин уже использован. Возвращайся завтра.'}const hp=document.getElementById('novaBossBar');if(hp)hp.style.width=(novaState.bossHp/10*100)+'%';renderNovaTreasure();renderNovaQuests()}
if(!Array.isArray(novaState.treasureMap)||novaState.treasureMap.length!==3)novaNewTreasure();
renderNovaHub();

const _arcadeOldUpdate=update;
update=function(){_arcadeOldUpdate();renderArcade();renderNovaHub()};
renderClashButtons();
renderArcade();
document.addEventListener('visibilitychange',()=>{if(document.hidden){[gridHuntActive,colorClashActive,typingActive,orbitalActive,meteorActive].forEach(()=>{});}});

window.lanConnectServer=lanConnectServer;window.lanDisconnect=lanDisconnect;window.lanCreateRoom=lanCreateRoom;window.lanJoinRoom=lanJoinRoom;window.lanSelectCase=lanSelectCase;window.lanStartBattle=lanStartBattle;window.lanSetMaxPlayers=lanSetMaxPlayers;
const _oldGo=window.go;window.go=function(page){_oldGo(page);if(page==='caseBattle')setTimeout(()=>{lanRenderCases();lanRenderResults();const inp=document.getElementById('lanServerInput');if(inp&&!inp.value)inp.value=lanServerDefault();lanUpdatePlayers()},0)};


/* ===== ENDGAME INFINITE ===== */
const EG_KEY='cr_endgame_v1';
function egLoad(){try{return JSON.parse(localStorage.getItem(EG_KEY)||'{}')}catch(e){return {}}}
function egSave(d){localStorage.setItem(EG_KEY,JSON.stringify(d))}
function egDay(){return Math.floor(Date.now()/86400000)}
function egState(){let d=egLoad(); if(!d.prestige)d.prestige=0;if(!d.ach)d.ach={};if(!d.missions)d.missions={};if(!d.raid||d.raid.week!==Math.floor(Date.now()/604800000)){d.raid={week:Math.floor(Date.now()/604800000),max:10000+Math.floor((d.prestige||0)*3500),hp:10000+Math.floor((d.prestige||0)*3500),hits:0,claimed:false}};egSave(d);return d}
const EG_ACH=[
 ['first','Первый шаг','Сыграй любую мини-игру',()=>Number(localStorage.getItem('cr_clickerCount')||0)>0],
 ['rich','Капитал','Накопи 100 000 монет',()=>typeof coins!=='undefined'&&coins>=100000],
 ['collector','Коллекционер','Собери 10 предметов',()=>typeof inv!=='undefined'&&inv.length>=10],
 ['arena','Арена','Проведи 10 матчей',()=>Number(localStorage.getItem('cr_arenaMatches')||0)>=10],
 ['nova','NOVA','Набери 1 000 NOVA очков',()=>Number(localStorage.getItem('nova_points')||0)>=1000],
 ['arcade','Аркадный монстр','Сыграй 25 аркадных раундов',()=>Number(localStorage.getItem('arcade_games')||0)>=25],
 ['million','Миллионер','Заработай 1 000 000 монет',()=>typeof coins!=='undefined'&&coins>=1000000],
 ['prestige','Вознесённый','Сделай первое вознесение',()=>egState().prestige>=1],
 ['raid','Охотник на титанов','Нанеси 50 ударов рейд-боссу',()=>egState().raid.hits>=50]
];
function egReward(n){let mult=1+(egState().prestige||0)*.1;let amount=Math.floor(n*mult);if(typeof coins!=='undefined')coins+=amount;if(typeof gainXP==='function')gainXP(Math.max(10,Math.floor(amount/100)));if(typeof save==='function')save();if(typeof update==='function')update();return amount}
function egRender(){let d=egState(), mult=1+(d.prestige||0)*.1;let req=1000000*(d.prestige+1);let ach=EG_ACH.filter(a=>d.ach[a[0]]).length;EG_ACH.forEach(a=>{if(!d.ach[a[0]]&&a[3]()){d.ach[a[0]]=Date.now();egReward(2500);}});egSave(d);document.getElementById('egPrestige').textContent=d.prestige;document.getElementById('egPrestigeReq').textContent=req.toLocaleString('ru-RU');document.getElementById('egMultiplier').textContent=mult.toFixed(2);document.getElementById('egAchDone').textContent=Object.keys(d.ach).length;document.getElementById('egAchTotal').textContent=EG_ACH.length;document.getElementById('egAchBar').style.width=(Object.keys(d.ach).length/EG_ACH.length*100)+'%';document.getElementById('egAchHint').textContent=Object.keys(d.ach).length>=EG_ACH.length?'Все достижения открыты!':'Следующая награда: 2 500 монет';
let aEl=document.getElementById('egAchievements');aEl.innerHTML=EG_ACH.map(a=>`<div class="card" style="opacity:${d.ach[a[0]]?1:.55}"><div style="font-size:28px">${d.ach[a[0]]?'🏆':'🔒'}</div><h3>${a[1]}</h3><div class="small">${a[2]}</div><div class="rarity" style="margin-top:8px">${d.ach[a[0]]?'ОТКРЫТО':'ЗАКРЫТО'}</div></div>`).join('');
let r=d.raid;document.getElementById('egBossHp').textContent=Math.max(0,r.hp).toLocaleString('ru-RU');document.getElementById('egBossMax').textContent=r.max.toLocaleString('ru-RU');document.getElementById('egBossBar').style.width=Math.max(0,r.hp/r.max*100)+'%';
let ms=[['Открой 5 достижений',()=>Object.keys(d.ach).length>=5],['Сделай 5 ударов по боссу',()=>r.hits>=5],['Накопи 250 000 монет',()=>typeof coins!=='undefined'&&coins>=250000]];document.getElementById('egMissions').innerHTML=ms.map(m=>`<div class="card"><b>${m[0]}</b><div class="rarity" style="margin-top:8px;color:${m[1]()?'#63e59a':'#7f91aa'}">${m[1]()?'✓ ВЫПОЛНЕНО':'В ПРОЦЕССЕ'}</div></div>`).join('');}
function egPrestigeUp(){let d=egState(),req=1000000*(d.prestige+1);if(typeof coins==='undefined'||coins<req){toast('Нужно '+req.toLocaleString('ru-RU')+' монет');return}coins=0;d.prestige++;d.ach.prestige=Date.now();egSave(d);if(typeof save==='function')save();if(typeof update==='function')update();beep(990,.2);toast('👑 Вознесение '+d.prestige+'! Множитель x'+(1+d.prestige*.1).toFixed(2));egRender()}
function egRaidHit(){let d=egState(),r=d.raid;if(r.hp<=0){toast('Босс уже побеждён — забери награду');return}let power=Math.max(25,Math.floor((typeof inv!=='undefined'?inv.reduce((a,s)=>a+(s.v||0),0):100)+Math.random()*250));power=Math.floor(power*(1+d.prestige*.1));r.hp=Math.max(0,r.hp-power);r.hits++;egSave(d);egReward(100+Math.floor(power/5));document.getElementById('egRaidMsg').textContent='Удар нанесён: -'+power+' HP. Сила зависит от твоей коллекции.';beep(700,.08);egRender()}
function egRaidClaim(){let d=egState(),r=d.raid;if(r.hp>0){toast('Сначала победи босса');return}if(r.claimed){toast('Награда уже получена');return}r.claimed=true;egSave(d);let n=egReward(25000);toast('🎁 Рейд завершён! +'+n.toLocaleString('ru-RU')+' монет');egRender()}
const _egOldUpdate=typeof update==='function'?update:null;
setTimeout(()=>{if(document.getElementById('endgame'))egRender()},200);

/* ===== ONLINE PROFILE / CLOUD SAVE ===== */
const MD_ONLINE_TOKEN_KEY='md_online_token';
let mdOnlineUser=null, mdOnlineTimer=null;
function mdApiBase(){ return ''; }
function mdToken(){ return localStorage.getItem(MD_ONLINE_TOKEN_KEY)||''; }
function mdSetMessage(t){ const e=document.getElementById('accountMessage'); if(e)e.textContent=t; }
function mdSetStatus(){
  const s=document.getElementById('onlineStatus'), n=document.getElementById('accountName'), i=document.getElementById('accountInfo'), b=document.getElementById('accountLogoutBtn');
  if(mdOnlineUser){ if(s){s.textContent='ОНЛАЙН';s.style.color='#63e59a'} if(n)n.textContent=mdOnlineUser.username; if(i)i.textContent=`Уровень ${mdOnlineUser.level||1} • ${Number(mdOnlineUser.score||0).toLocaleString('ru-RU')} очков`; if(b)b.disabled=false; }
  else {if(s){s.textContent='НЕ ВОЙДЁН';s.style.color=''} if(n)n.textContent='Гость'; if(i)i.textContent='Войди или зарегистрируйся.'; if(b)b.disabled=true;}
}
function mdCollectSave(){
  const keys={};
  for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k && (k.startsWith('cr_')||k.startsWith('mission_')||k.startsWith('col_')||k.startsWith('season_')||k==='cr_endgame_v1'))keys[k]=localStorage.getItem(k)}
  return keys;
}
function mdApplySave(keys){ if(!keys)return; Object.entries(keys).forEach(([k,v])=>{if(typeof v==='string')localStorage.setItem(k,v)}); }
async function mdApi(path,opts={}){
  const h=Object.assign({'Content-Type':'application/json'},opts.headers||{}); const t=mdToken(); if(t)h.Authorization='Bearer '+t;
  const r=await fetch(mdApiBase()+path,Object.assign({},opts,{headers:h}));
  let d={}; try{d=await r.json()}catch(e){}
  if(!r.ok)throw new Error(d.error||'Ошибка сервера'); return d;
}
async function mdRegister(){
  const username=(document.getElementById('regUser')?.value||'').trim(), password=document.getElementById('regPass')?.value||'';
  if(username.length<3||password.length<6)return mdSetMessage('Никнейм: минимум 3 символа. Пароль: минимум 6.');
  try{const d=await mdApi('/api/register',{method:'POST',body:JSON.stringify({username,password})});localStorage.setItem(MD_ONLINE_TOKEN_KEY,d.token);mdOnlineUser=d.user;mdSetStatus();mdSetMessage('Аккаунт создан. Синхронизируем прогресс…');await mdSyncNow(true);toast('Аккаунт создан!')}catch(e){mdSetMessage(e.message)}
}
async function mdLogin(){
  const username=(document.getElementById('loginUser')?.value||'').trim(), password=document.getElementById('loginPass')?.value||'';
  try{const d=await mdApi('/api/login',{method:'POST',body:JSON.stringify({username,password})});localStorage.setItem(MD_ONLINE_TOKEN_KEY,d.token);mdOnlineUser=d.user;mdSetStatus();mdSetMessage('Вход выполнен. Загружаем сохранение…');await mdLoadCloud();toast('Добро пожаловать, '+d.user.username+'!')}catch(e){mdSetMessage(e.message)}
}
async function mdLoadCloud(){
  if(!mdToken())return; const d=await mdApi('/api/save');
  if(d.save && d.save.keys && Object.keys(d.save.keys).length){mdApplySave(d.save.keys);setTimeout(()=>location.reload(),250);return true}
  return false;
}
async function mdSyncNow(silent=false){
  if(!mdToken()){if(!silent)mdSetMessage('Сначала войди в аккаунт.');return false}
  try{const d=await mdApi('/api/save',{method:'POST',body:JSON.stringify({keys:mdCollectSave()})});mdOnlineUser=d.user;mdSetStatus();if(!silent)mdSetMessage('Прогресс сохранён на сервере.');return true}catch(e){if(!silent)mdSetMessage(e.message);return false}
}
async function mdLogout(){
  try{await mdApi('/api/logout',{method:'POST'})}catch(e){}
  localStorage.removeItem(MD_ONLINE_TOKEN_KEY);mdOnlineUser=null;mdSetStatus();mdSetMessage('Вы вышли из аккаунта. Локальный прогресс остался в этом браузере.');
}
async function mdLeaderboard(){
  try{const d=await mdApi('/api/leaderboard');const g=document.getElementById('onlineLeaderboard');if(!g)return;g.innerHTML=(d.players||[]).map((u,i)=>`<div class="card"><div class="rarity">#${i+1}</div><h3>${String(u.username).replace(/[&<>"']/g,'')}</h3><div class="value">${Number(u.score||0).toLocaleString('ru-RU')}</div><div class="small">Уровень ${u.level||1} • ${u.opened||0} кейсов</div></div>`).join('')||'<div class="small">Пока нет игроков.</div>';}catch(e){const g=document.getElementById('onlineLeaderboard');if(g)g.innerHTML='<div class="small">Рейтинг станет доступен после запуска сервера.</div>'}
}
async function mdBootOnline(){
  mdSetStatus(); mdLeaderboard();
  if(!mdToken())return;
  try{const d=await mdApi('/api/me');mdOnlineUser=d.user;mdSetStatus();mdLeaderboard();}catch(e){localStorage.removeItem(MD_ONLINE_TOKEN_KEY);mdOnlineUser=null;mdSetStatus()}
  clearInterval(mdOnlineTimer); mdOnlineTimer=setInterval(()=>mdSyncNow(true),30000);
}
const _mdOldSave=window.save;
if(typeof _mdOldSave==='function'){ window.save=function(){const r=_mdOldSave.apply(this,arguments); if(mdOnlineUser)mdSyncNow(true); return r;} }
setTimeout(mdBootOnline,250);
