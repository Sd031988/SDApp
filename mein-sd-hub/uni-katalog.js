/* Kurse von Universitäten bei externen Anbietern (keine Partnerschaft mit dem SD Hub). Links und Kosten geprüft am 23.11.2026.
   Kosten: "frei" = ganzer Kurs kostenlos; "vorschau" = Coursera: erstes Modul kostenlos, voller Kurs/Zertifikat kostenpflichtig, Finanzhilfe beantragbar. */
(function(root){
"use strict";
const K=[
 {uni:"Harvard University",kurz:"HU",titel:"CS50x – Einführung in die Informatik",anbieter:"cs50.harvard.edu",url:"https://cs50.harvard.edu/x/",bereich:"Programmieren",stufe:"Einsteiger",sprache:"Englisch, Untertitel",kosten:"frei",video:true},
 {uni:"Harvard University",kurz:"HU",titel:"CS50P – Programmieren mit Python",anbieter:"cs50.harvard.edu",url:"https://cs50.harvard.edu/python/",bereich:"Python & KI",stufe:"Einsteiger",sprache:"Englisch, Untertitel",kosten:"frei",video:true},
 {uni:"Harvard University",kurz:"HU",titel:"CS50 AI – Künstliche Intelligenz mit Python",anbieter:"cs50.harvard.edu",url:"https://cs50.harvard.edu/ai/",bereich:"Python & KI",stufe:"Fortgeschritten",sprache:"Englisch, Untertitel",kosten:"frei",video:true},
 {uni:"Harvard University",kurz:"HU",titel:"CS50 2D – Spieleprogrammierung",anbieter:"cs50.harvard.edu",url:"https://cs50.harvard.edu/games",bereich:"C++ & Rust",stufe:"Fortgeschritten",sprache:"Englisch, Untertitel",kosten:"frei",video:true},
 {uni:"Harvard University",kurz:"HU",titel:"CS50 Web – Webentwicklung mit Python und JavaScript",anbieter:"cs50.harvard.edu",url:"https://cs50.harvard.edu/web/",bereich:"Programmieren",stufe:"Fortgeschritten",sprache:"Englisch, Untertitel",kosten:"frei",video:true},
 {uni:"Massachusetts Institute of Technology",kurz:"MIT",titel:"6.100L – Informatik und Programmieren mit Python",anbieter:"MIT OpenCourseWare",url:"https://ocw.mit.edu/courses/6-100l-introduction-to-cs-and-programming-using-python-fall-2022/",bereich:"Python & KI",stufe:"Einsteiger",sprache:"Englisch",kosten:"frei",video:true},
 {uni:"Universität Helsinki",kurz:"UH",titel:"Python Programming MOOC 2026",anbieter:"mooc.fi",url:"https://programming-26.mooc.fi/",bereich:"Python & KI",stufe:"Einsteiger",sprache:"Englisch",kosten:"frei",video:false},
 {uni:"Universität Helsinki",kurz:"UH",titel:"Elements of AI – KI verstehen ohne Mathe",anbieter:"elementsofai.com",url:"https://www.elementsofai.com/",bereich:"Python & KI",stufe:"Einsteiger",sprache:"Viele Sprachen, auch Deutsch",kosten:"frei",video:false},
 {uni:"Hasso-Plattner-Institut",kurz:"HPI",titel:"Python für Einsteiger",anbieter:"openHPI",url:"https://open.hpi.de/courses/python2025",bereich:"Python & KI",stufe:"Einsteiger",sprache:"Deutsch/Englisch",kosten:"frei",video:true},
 {uni:"KI-Campus (öffentlich gefördert)",kurz:"KI",titel:"Kostenlose KI-Kurse für alle Stufen",anbieter:"ki-campus.org",url:"https://ki-campus.org/",bereich:"Python & KI",stufe:"Alle Stufen",sprache:"Deutsch",kosten:"frei",video:true},
 {uni:"University of Michigan",kurz:"UM",titel:"Python for Everybody (Spezialisierung)",anbieter:"Coursera",url:"https://www.coursera.org/specializations/python",bereich:"Python & KI",stufe:"Einsteiger",sprache:"Englisch, Untertitel",kosten:"vorschau",video:true},
 {uni:"Stanford University",kurz:"SU",titel:"Machine Learning Specialization",anbieter:"Coursera",url:"https://www.coursera.org/specializations/machine-learning-introduction",bereich:"Python & KI",stufe:"Fortgeschritten",sprache:"Englisch, Untertitel",kosten:"vorschau",video:true},
 {uni:"University of Illinois Urbana-Champaign",kurz:"UI",titel:"Object-Oriented Data Structures in C++",anbieter:"Coursera",url:"https://www.coursera.org/learn/cs-fundamentals-1",bereich:"C++ & Rust",stufe:"Fortgeschritten",sprache:"Englisch, Untertitel",kosten:"vorschau",video:true},
 {uni:"Duke University",kurz:"DU",titel:"Rust Programming (Spezialisierung)",anbieter:"Coursera",url:"https://www.coursera.org/specializations/rust-programming",bereich:"C++ & Rust",stufe:"Fortgeschritten",sprache:"Englisch, Untertitel",kosten:"vorschau",video:true},
 {uni:"Michigan State University",kurz:"MSU",titel:"Game Design and Development with Unity",anbieter:"Coursera",url:"https://www.coursera.org/specializations/game-design-and-development",bereich:"C++ & Rust",stufe:"Einsteiger",sprache:"Englisch, Untertitel",kosten:"vorschau",video:true},
 {uni:"Michigan State University",kurz:"MSU",titel:"Pixel Art for Video Games",anbieter:"Coursera",url:"https://www.coursera.org/learn/pixel-art-video-games",bereich:"C++ & Rust",stufe:"Einsteiger",sprache:"Englisch, Untertitel",kosten:"vorschau",video:true}
];
root.SDUniKatalog=K;
if(typeof module!=="undefined")module.exports=K;
})(typeof window!=="undefined"?window:globalThis);
