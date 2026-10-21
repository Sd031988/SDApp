"""Bilder zu Wörtern.

Jede Zeile: Wort (ohne Artikel) · Emoji · optional „*“.
„*“ heißt: zu diesem Wort darf zusätzlich ein echtes Foto aus der deutschen Wikipedia gezeigt werden
(nur bei eindeutigen, greifbaren Dingen wie Essen, Tieren, Gegenständen, Fahrzeugen, Orten).
"""

_RAW = """
Oma 👵
Opa 👴
Igel 🦔 *
Uhr ⌚ *
Esel 🫏 *
Ofen 🔥
Ente 🦆 *
Insel 🏝️ *
Ampel 🚦 *
Obst 🍎 *
Mama 👩
Papa 👨
Salz 🧂 *
Milch 🥛 *
Nase 👃
Messer 🔪 *
Mann 👨
Frau 👩
Lampe 💡 *
Sonne ☀️ *
Sofa 🛋️ *
Tee 🍵 *
Tomate 🍅 *
Rad 🚲
Fahrrad 🚲 *
Haus 🏠 *
Hand ✋
Brot 🍞 *
Bus 🚌 *
Bett 🛏️ *
Hut 👒 *
Bad 🛁
Kaffee ☕ *
Kopf 🙂
Geld 💶 *
Gabel 🍴
Fisch 🐟 *
Fenster 🪟 *
Wasser 💧
Wagen 🚗
Auto 🚗 *
Euro 💶 *
Telefonnummer 📞
Adresse 🏠
Straße 🛣️ *
Stadt 🏙️
Land 🌍
Formular 📝
Unterschrift ✍️
Schule 🏫 *
Schuh 👞 *
Buch 📖 *
Ei 🥚 *
Apfel 🍎 *
Tür 🚪 *
Eingang 🚪
Ausgang 🚪
Toilette 🚻
Bahnhof 🚉 *
Apotheke 💊
Haltestelle 🚏
Notruf 🚨
Schild 🪧
Handy 📱
E-Mail 📧
Junge 👦
Mädchen 👧
Mensch 🧑
Leute 👥
Freund 🧑‍🤝‍🧑
Freundin 🧑‍🤝‍🧑
Welt 🌍
Buchstabe 🔤
Frage ❓
Antwort 💬
Gespräch 💬
Kugelschreiber 🖊️ *
Bleistift ✏️ *
Papier 📄 *
Gruppe 👥
Uhrzeit 🕒
Stunde ⏰
Minute ⏱️
Termin 📅
Kalender 📅
Datum 📅
Woche 📅
Monat 📅
Jahr 📅
Frühling 🌷
Sommer ☀️
Herbst 🍂
Winter ❄️
Telefon ☎️ *
Nachricht ✉️
Familie 👨‍👩‍👧‍👦
Eltern 👫
Vater 👨
Mutter 👩
Sohn 👦
Tochter 👧
Bruder 👦
Schwester 👧
Kind 🧒
Baby 👶
Großvater 👴
Großmutter 👵
Großeltern 👵👴
Hochzeit 💒
Haare 💇
Haar 💇
Auge 👁️
Foto 📷
Party 🎉
Geburtstag 🎂
Geschenk 🎁
Einladung 💌
Lied 🎵
Hund 🐕 *
Gemüse 🥦 *
Kartoffel 🥔 *
Reis 🍚 *
Fleisch 🥩 *
Hähnchen 🍗
Käse 🧀 *
Flasche 🍾
Kasse 💰
Banane 🍌 *
Orange 🍊 *
Traube 🍇
Zitrone 🍋 *
Gurke 🥒 *
Zwiebel 🧅 *
Karotte 🥕 *
Salat 🥗
Knoblauch 🧄 *
Brötchen 🥖 *
Butter 🧈 *
Joghurt 🥣 *
Mehl 🌾 *
Zucker 🍬
Öl 🫒
Nudel 🍝
Wurst 🌭
Kuchen 🍰 *
Suppe 🍲 *
Getränk 🥤
Saft 🧃 *
Mineralwasser 💧
Frühstück 🍳 *
Mittagessen 🍽️
Abendessen 🍽️
Hunger 😋
Durst 🥤
Tüte 🛍️
Glas 🥛
Markt 🛒
Bäckerei 🥐 *
Kellner 🤵
Bier 🍺 *
Wein 🍷 *
Birne 🍐
Schinken 🥓 *
Pommes frites 🍟 *
Speisekarte 📜
Rechnung 🧾
Laden 🏪
Kleidung 👕 *
Jacke 🧥 *
Farbe 🎨
Tasche 👜
Zigarette 🚬 *
Kreditkarte 💳 *
Wohnung 🏢
Zimmer 🚪
Küche 🍳
Schlafzimmer 🛏️
Wohnzimmer 🛋️
Balkon 🏡 *
Aufzug 🛗 *
Tisch 🪑 *
Stuhl 🪑 *
Schrank 🗄️
Miete 💶
Kinderzimmer 🧸
Keller 🏚️
Garten 🌳 *
Treppe 🪜 *
Wand 🧱
Boden 🟫
Möbel 🛋️ *
Regal 📚
Sessel 💺
Teppich 🟥 *
Kühlschrank 🧊 *
Herd 🍳
Waschmaschine 🧺 *
Spülmaschine 🍽️
Fernseher 📺 *
Spiegel 🪞 *
Dusche 🚿 *
Bild 🖼️
Brille 👓 *
Schlüssel 🔑 *
Hochhaus 🏢 *
Licht 💡
Dorf 🏘️ *
Feuer 🔥 *
Maschine ⚙️
Morgen 🌅
Abend 🌆
Nacht 🌙
Zähne putzen 🪥
Wäsche 🧺
Film 🎬
Kino 🎦 *
Park 🌳
Sport ⚽
Hobby 🎨
Fußball ⚽ *
Schwimmbad 🏊 *
See 🏞️
Disco 🪩
CD 💿
Internet 🌐
Drucker 🖨️ *
Zeitung 📰 *
Wetter 🌦️
Regen 🌧️ *
Wind 🌬️ *
Ausflug 🚌
Feier 🎉
Kiosk 🏪 *
Arzt 🧑‍⚕️
Ärztin 👩‍⚕️
Praxis 🏥
Bauch 🫃
Rücken 🧍
Hals 🧣
Bein 🦵
Arm 💪
Schmerzen 🤕
Fieber 🤒
Erkältung 🤧
Rezept 📋
Tablette 💊 *
Körper 🧍
Ohr 👂
Mund 👄
Zahn 🦷
Gesicht 🙂
Fuß 🦶
Knie 🦵
Herz ❤️
Finger ☝️
Magen 🫃
Kopfschmerzen 🤕
Bauchschmerzen 🤢
Zahnschmerzen 🦷
Husten 😷
Schnupfen 🤧
Grippe 🤒
Unfall 💥
Wartezimmer 🪑
Krankenhaus 🏥 *
Zahnarzt 🦷
Medizin 💊
Doktor 🧑‍⚕️
Weg 🛤️
Kreuzung 🚦
Straßenbahn 🚋 *
U-Bahn 🚇 *
Fahrkarte 🎫 *
Rathaus 🏛️ *
Bank 🏦
Supermarkt 🛒 *
Kirche ⛪ *
Moschee 🕌 *
Museum 🏛️
Bibliothek 📚 *
Polizei 👮
Post 📮
Geschäft 🏪
Restaurant 🍽️ *
Café ☕
Hotel 🏨 *
Taxi 🚕 *
Brücke 🌉 *
Parkplatz 🅿️ *
Stadtplan 🗺️
Reise 🧳
Urlaub 🏖️
Ticket 🎫
Flugzeug ✈️ *
Flughafen 🛫 *
Meer 🌊 *
Berg ⛰️ *
Abfahrt 🚆
Ankunft 🛬
Bahn 🚆
S-Bahn 🚈 *
Bahnsteig 🚉 *
Gleis 🛤️
Zug 🚆 *
Abflug 🛫
Gepäck 🧳
Koffer 🧳 *
Pass 🛂
Ausweis 🪪
Reisepass 🛂 *
Zoll 🛃
Autobahn 🛣️ *
Lkw 🚚 *
Automat 🏧
Baum 🌳 *
Blume 🌸 *
Norden ⬆️
Süden ⬇️
Westen ⬅️
Osten ➡️
Arbeit 💼
Chef 👔
Koch 🧑‍🍳
Fahrer 🚗
Lehrer 🧑‍🏫
Lehrerin 👩‍🏫
Verkäufer 🧑‍💼
Verkäuferin 👩‍💼
Friseur 💇
Mechaniker 🧑‍🔧
Elektriker 🧑‍🔧
Maler 🧑‍🎨
Bäcker 🧑‍🍳
Ingenieur 🧑‍💻
Student 🧑‍🎓
Studentin 👩‍🎓
Schüler 🧒
Schülerin 👧
Büro 🏢
Fabrik 🏭 *
Lager 📦
Werkstatt 🔧
Computer 💻 *
Werkzeug 🔧 *
Kindergarten 🧸
Klasse 🧑‍🏫
Hausaufgabe 📓
Unterricht 🧑‍🏫
Brief ✉️
Briefmarke 📮 *
Kopie 📄
Passfoto 🖼️
Stempel 🔖
Geldautomat 🏧 *
App 📲
WLAN 📶
Zeitschrift 📰
Radio 📻 *
Wörterbuch 📕
Universität 🎓
Heizung 🌡️
Haustier 🐈
Umzug 📦
Karton 📦 *
Briefkasten 📫 *
Klingel 🛎️
Mülltonne 🗑️ *
Steckdose 🔌 *
Waschbecken 🚰 *
Badewanne 🛁 *
Wasserhahn 🚰 *
Angst 😨
Garage 🚘 *
Schere ✂️ *
Seife 🧼 *
Handtuch 🧻
Teller 🍽️ *
Tasse ☕ *
Löffel 🥄 *
Topf 🍲
Geschirr 🍽️ *
Müll 🗑️
Baustelle 🚧 *
Rose 🌹 *
Führerschein 🪪 *
Natur 🌿
Wald 🌲 *
Fluss 🏞️ *
Feld 🌾
Pflanze 🪴
Tier 🐾
Katze 🐈 *
Vogel 🐦
Pferd 🐎 *
Kuh 🐄 *
Schaf 🐑 *
Luft 🌬️
Himmel 🌌
Polizist 🧑‍✈️
Mobiltelefon 📱 *
Tablet 📱
Kamera 📷 *
Fotoapparat 📷 *
Motor ⚙️
Medikament 💊
Krankenwagen 🚑 *
Spritze 💉 *
Pflaster 🩹 *
Verband 🩹
Feuerwehr 🚒 *
Schokolade 🍫 *
Süßigkeiten 🍬 *
Bohne 🫘
Rind 🐂
Schwein 🐖 *
Pizza 🍕 *
Hamburger 🍔 *
Spielzeug 🧸
Spielplatz 🛝 *
Kinderwagen 👶
Windel 👶
Heft 📓
Stift ✏️
Lineal 📏 *
Schultasche 🎒
Musik 🎵
Tafel 🧑‍🏫
Ball ⚽
Zoo 🦁
Zirkus 🎪 *
Traum 💭
Rätsel 🧩
Rucksack 🎒 *
Schiff 🚢 *
Fähre ⛴️ *
Stau 🚗
Tankstelle ⛽ *
Landkarte 🗺️
Hafen ⚓
Schnee ❄️ *
Gewitter ⛈️ *
Zelt ⛺ *
Schloss 🏰
Strand 🏖️ *
Wolke ☁️ *
Motorroller 🛵 *
Reifen 🛞 *
Schirm ☂️
Regenschirm ☂️ *
Postkarte 📮 *
Torte 🎂 *
Kerze 🕯️ *
Feuerwerk 🎆 *
Weihnachtsmarkt 🎄 *
Gitarre 🎸 *
Klavier 🎹 *
Basketball 🏀 *
Volleyball 🏐 *
Ski 🎿 *
Tennis 🎾 *
Konzert 🎤
Theater 🎭 *
Spiel 🎲
Fitnessstudio 🏋️
Eis 🍦
Hose 👖 *
Hemd 👔 *
Pullover 🧶 *
T-Shirt 👕 *
Kleid 👗 *
Rock 👗
Mantel 🧥 *
Anzug 🤵 *
Socke 🧦 *
Schal 🧣 *
Kopftuch 🧕 *
Mütze 🧢
Handschuh 🧤 *
Stiefel 🥾 *
Bluse 👚
Jeans 👖 *
Kette 📿
Ring 💍
Parfüm 🧴 *
Geldbörse 👛 *
Portemonnaie 👛 *
Paket 📦 *
Bargeld 💵 *
Wasserkocher 🫖 *
Laptop 💻 *
Tastatur ⌨️ *
Ladegerät 🔌
Akku 🔋
Affe 🐒 *
Hase 🐇 *
Mücke 🦟 *
Bär 🐻 *
Biene 🐝 *
Insekt 🐞
Pinguin 🐧 *
Elefant 🐘 *
Krokodil 🐊 *
Schildkröte 🐢 *
Schlange 🐍 *
Fliege 🪰 *
Löwe 🦁 *
Giraffe 🦒 *
Huhn 🐔 *
Maus 🐭
Frosch 🐸 *
Ziege 🐐 *
Wolf 🐺 *
Fuchs 🦊 *
Kaninchen 🐇 *
Gans 🪿 *
Kirsche 🍒 *
Erdbeere 🍓 *
Ananas 🍍 *
Melone 🍉
Pfirsich 🍑 *
Pilz 🍄
Mais 🌽 *
Paprika 🫑
Brokkoli 🥦 *
Honig 🍯 *
Keks 🍪 *
Steak 🥩 *
Snack 🍿
Bikini 👙 *
Mountainbike 🚵 *
E-Bike 🚲 *
Swimmingpool 🏊 *
Alkohol 🍸
Alarm 🚨
Alphabet 🔤
Abfall 🗑️
Abfalleimer 🗑️
Mond 🌙 *
Stern ⭐
Erde 🌍
Blatt 🍃
Hammer 🔨 *
Schraube 🔩 *
Kiste 📦
Kühlschrank 🧊 *
Uhrzeit 🕒
Wecker ⏰ *
Kamm 🪮
Zahnbürste 🪥 *
Zahnpasta 🪥 *
Kissen 🛏️
Decke 🛏️
Vorhang 🪟
Bettdecke 🛏️
Fahrstuhl 🛗 *
Rakete 🚀
Hubschrauber 🚁 *
Boot 🛶
Motorrad 🏍️ *
Polizeiauto 🚓
Krone 👑
Diamant 💎
Gold 🥇
Medaille 🏅 *
Pokal 🏆 *
Trommel 🥁 *
Geige 🎻 *
Trompete 🎺 *
Mikrofon 🎤 *
Kopfhörer 🎧 *
Batterie 🔋 *
Glühbirne 💡 *
Kerze 🕯️ *
Magnet 🧲
Lupe 🔍
Schloss 🏰
Brot 🍞 *
Pfeffer 🌶️
Gewürz 🧂
essen 🍽️
trinken 🥤
schlafen 😴
lesen 📖
schreiben ✍️
hören 👂
sehen 👀
lachen 😂
weinen 😢
kochen 🧑‍🍳
tanzen 💃
singen 🎤
schwimmen 🏊
laufen 🏃
gehen 🚶
fahren 🚗
fliegen ✈️
spielen 🎲
lernen 📚
arbeiten 💼
telefonieren 📞
anrufen 📞
kaufen 🛒
bezahlen 💳
duschen 🚿
waschen 🧼
putzen 🧽
aufstehen ⏰
aufwachen 🥱
fernsehen 📺
wandern 🥾
Rad fahren 🚴
Fußball spielen ⚽
Musik hören 🎧
grillen 🍖
regnen 🌧️
rauchen 🚬
bluten 🩸
husten 😷
lieben ❤️
feiern 🎉
gratulieren 🥳
warten ⏳
suchen 🔍
reparieren 🔧
bauen 🏗️
drucken 🖨️
packen 🧳
umziehen 📦
sitzen 🪑
müde 😴
krank 🤒
gesund 💪
glücklich 😊
traurig 😢
böse 😠
lustig 😄
heiß 🔥
warm ☀️
kalt 🥶
groß 🐘
klein 🐭
schnell 🐆
langsam 🐌
teuer 💰
billig 🏷️
laut 🔊
leise 🔈
hell 💡
dunkel 🌑
sauber ✨
schmutzig 🟤
kaputt 💔
lecker 😋
rot 🟥
grün 🟩
blau 🟦
gelb 🟨
schwarz ⬛
weiß ⬜
braun 🟫
grau ⬜
orange 🟧
lila 🟪
links ⬅️
rechts ➡️
geradeaus ⬆️
oben ⬆️
unten ⬇️
ja ✅
nein ❌
hallo 👋
Tschüss! 👋
Guten Morgen! 🌅
Gute Nacht! 🌙
danke 🙏
"""

PICS = {}
for _line in _RAW.strip().splitlines():
    _parts = _line.split()
    if len(_parts) < 2:
        continue
    _photo = _parts[-1] == "*"
    _emo = _parts[-2] if _photo else _parts[-1]
    _word = " ".join(_parts[:-2] if _photo else _parts[:-1])
    PICS[_word] = (_emo, _photo)


def pic_for(de: str):
    """(emoji, foto_erlaubt) für ein Wort wie „der Apfel“ oder „Apfel“, sonst (\"\", False)."""
    w = de.strip()
    head = w.split(" ", 1)
    if head[0] in ("der", "die", "das") and len(head) == 2:
        w = head[1]
    w = w.split(" / ")[0].split(" (")[0].strip()
    return PICS.get(w, ("", False))
