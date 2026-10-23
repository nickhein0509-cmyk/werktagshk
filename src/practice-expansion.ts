import type { Exercise } from './data';

// Stable IDs: changing a prompt or answer requires a new content version.
export const practiceExpansion: Exercise[] = [
  {
    id: 'heizung-heizzeit-v1-1',
    topicId: 'heizung',
    title: 'Heizzeit ohne Verluste · Variante 1',
    context:
      'Ein idealer Wärmeerzeuger liefert konstant 3 kW an Wasser. Benötigt werden 6 kWh Wärme. Verluste, Anlaufzeit und Behälterwärme sind ausgeschlossen.',
    question:
      'Wie lange dauert die Erwärmung in Minuten? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['60,00 min', '120,00 min', '240,00 min', '1200,00 min'],
    correctIndex: 1,
    explanation:
      'Zeit: 6 kWh / 3 kW × 60 min/h.\nErgebnis: 120,00 min. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Berechne zunächst Stunden und rechne in Minuten um.',
    formula: 't = Q / P',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-heizzeit-v1-2',
    topicId: 'heizung',
    title: 'Heizzeit ohne Verluste · Variante 2',
    context:
      'Ein idealer Wärmeerzeuger liefert konstant 6 kW an Wasser. Benötigt werden 9 kWh Wärme. Verluste, Anlaufzeit und Behälterwärme sind ausgeschlossen.',
    question:
      'Wie lange dauert die Erwärmung in Minuten? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['45,00 min', '180,00 min', '900,00 min', '90,00 min'],
    correctIndex: 3,
    explanation:
      'Zeit: 9 kWh / 6 kW × 60 min/h.\nErgebnis: 90,00 min. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Berechne zunächst Stunden und rechne in Minuten um.',
    formula: 't = Q / P',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-heizzeit-v1-3',
    topicId: 'heizung',
    title: 'Heizzeit ohne Verluste · Variante 3',
    context:
      'Ein idealer Wärmeerzeuger liefert konstant 4 kW an Wasser. Benötigt werden 5 kWh Wärme. Verluste, Anlaufzeit und Behälterwärme sind ausgeschlossen.',
    question:
      'Wie lange dauert die Erwärmung in Minuten? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['37,50 min', '75,00 min', '150,00 min', '750,00 min'],
    correctIndex: 1,
    explanation:
      'Zeit: 5 kWh / 4 kW × 60 min/h.\nErgebnis: 75,00 min. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Berechne zunächst Stunden und rechne in Minuten um.',
    formula: 't = Q / P',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-nutzwaerme-v1-1',
    topicId: 'heizung',
    title: 'Nutzwärme aus Energieeinsatz · Variante 1',
    context:
      'Im Aufgabenmodell werden 50 kWh Energie eingesetzt. Der vorgegebene Nutzungsgrad beträgt 80 %. Alle Energien beziehen sich auf denselben Zeitraum und dieselbe Bilanzgrenze.',
    question: 'Welche Nutzwärme entsteht? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['40,00 kWh', '20,00 kWh', '80,00 kWh', '400,00 kWh'],
    correctIndex: 0,
    explanation:
      'Nutzwärme: 50 kWh × 80 / 100. Der Rest ist im Modell Verlustenergie.\nErgebnis: 40,00 kWh. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Setze den Prozentwert als Dezimalzahl ein.',
    formula: 'Q_nutz = E · η',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-nutzwaerme-v1-2',
    topicId: 'heizung',
    title: 'Nutzwärme aus Energieeinsatz · Variante 2',
    context:
      'Im Aufgabenmodell werden 80 kWh Energie eingesetzt. Der vorgegebene Nutzungsgrad beträgt 90 %. Alle Energien beziehen sich auf denselben Zeitraum und dieselbe Bilanzgrenze.',
    question: 'Welche Nutzwärme entsteht? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['36,00 kWh', '144,00 kWh', '72,00 kWh', '720,00 kWh'],
    correctIndex: 2,
    explanation:
      'Nutzwärme: 80 kWh × 90 / 100. Der Rest ist im Modell Verlustenergie.\nErgebnis: 72,00 kWh. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Setze den Prozentwert als Dezimalzahl ein.',
    formula: 'Q_nutz = E · η',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-nutzwaerme-v1-3',
    topicId: 'heizung',
    title: 'Nutzwärme aus Energieeinsatz · Variante 3',
    context:
      'Im Aufgabenmodell werden 120 kWh Energie eingesetzt. Der vorgegebene Nutzungsgrad beträgt 85 %. Alle Energien beziehen sich auf denselben Zeitraum und dieselbe Bilanzgrenze.',
    question: 'Welche Nutzwärme entsteht? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['102,00 kWh', '51,00 kWh', '204,00 kWh', '1020,00 kWh'],
    correctIndex: 0,
    explanation:
      'Nutzwärme: 120 kWh × 85 / 100. Der Rest ist im Modell Verlustenergie.\nErgebnis: 102,00 kWh. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Setze den Prozentwert als Dezimalzahl ein.',
    formula: 'Q_nutz = E · η',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-energieeinsatz-v1-1',
    topicId: 'heizung',
    title: 'Energieeinsatz zurückrechnen · Variante 1',
    context:
      'Es werden 40 kWh Nutzwärme benötigt. Vorgegeben ist ein Nutzungsgrad von 80 % bei gleicher Bilanzgrenze. Weitere Energieflüsse bleiben unberücksichtigt.',
    question:
      'Wie viel Energie muss eingesetzt werden? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['25,00 kWh', '100,00 kWh', '500,00 kWh', '50,00 kWh'],
    correctIndex: 3,
    explanation:
      'Energieeinsatz: 40 kWh / (80 / 100).\nErgebnis: 50,00 kWh. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Bei einem Nutzungsgrad unter 100 % ist der Einsatz größer als die Nutzwärme.',
    formula: 'E = Q_nutz / η',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-energieeinsatz-v1-2',
    topicId: 'heizung',
    title: 'Energieeinsatz zurückrechnen · Variante 2',
    context:
      'Es werden 72 kWh Nutzwärme benötigt. Vorgegeben ist ein Nutzungsgrad von 90 % bei gleicher Bilanzgrenze. Weitere Energieflüsse bleiben unberücksichtigt.',
    question:
      'Wie viel Energie muss eingesetzt werden? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['40,00 kWh', '80,00 kWh', '160,00 kWh', '800,00 kWh'],
    correctIndex: 1,
    explanation:
      'Energieeinsatz: 72 kWh / (90 / 100).\nErgebnis: 80,00 kWh. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Bei einem Nutzungsgrad unter 100 % ist der Einsatz größer als die Nutzwärme.',
    formula: 'E = Q_nutz / η',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-energieeinsatz-v1-3',
    topicId: 'heizung',
    title: 'Energieeinsatz zurückrechnen · Variante 3',
    context:
      'Es werden 51 kWh Nutzwärme benötigt. Vorgegeben ist ein Nutzungsgrad von 85 % bei gleicher Bilanzgrenze. Weitere Energieflüsse bleiben unberücksichtigt.',
    question:
      'Wie viel Energie muss eingesetzt werden? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['30,00 kWh', '120,00 kWh', '600,00 kWh', '60,00 kWh'],
    correctIndex: 3,
    explanation:
      'Energieeinsatz: 51 kWh / (85 / 100).\nErgebnis: 60,00 kWh. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Bei einem Nutzungsgrad unter 100 % ist der Einsatz größer als die Nutzwärme.',
    formula: 'E = Q_nutz / η',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-spreizung-v1-1',
    topicId: 'heizung',
    title: 'Spreizung aus der Leistung · Variante 1',
    context:
      'Ein stationärer Wasserkreis überträgt 8,4 kW bei 0,2 kg/s Massenstrom. Es gilt c = 4,2 kJ/(kg · K), ohne Wärmeverluste.',
    question:
      'Welche Temperaturspreizung ergibt sich? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['5,00 K', '20,00 K', '10,00 K', '100,00 K'],
    correctIndex: 2,
    explanation:
      'Spreizung: 8,4 kJ/s / (0,2 kg/s × 4,2 kJ/(kg · K)).\nErgebnis: 10,00 K. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: '1 kW = 1 kJ/s. Teile durch Massenstrom und Wärmekapazität.',
    formula: 'ΔT = P / (ṁ · c)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-spreizung-v1-2',
    topicId: 'heizung',
    title: 'Spreizung aus der Leistung · Variante 2',
    context:
      'Ein stationärer Wasserkreis überträgt 12,6 kW bei 0,3 kg/s Massenstrom. Es gilt c = 4,2 kJ/(kg · K), ohne Wärmeverluste.',
    question:
      'Welche Temperaturspreizung ergibt sich? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['10,00 K', '5,00 K', '20,00 K', '100,00 K'],
    correctIndex: 0,
    explanation:
      'Spreizung: 12,6 kJ/s / (0,3 kg/s × 4,2 kJ/(kg · K)).\nErgebnis: 10,00 K. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: '1 kW = 1 kJ/s. Teile durch Massenstrom und Wärmekapazität.',
    formula: 'ΔT = P / (ṁ · c)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-spreizung-v1-3',
    topicId: 'heizung',
    title: 'Spreizung aus der Leistung · Variante 3',
    context:
      'Ein stationärer Wasserkreis überträgt 6,3 kW bei 0,1 kg/s Massenstrom. Es gilt c = 4,2 kJ/(kg · K), ohne Wärmeverluste.',
    question:
      'Welche Temperaturspreizung ergibt sich? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['7,50 K', '30,00 K', '15,00 K', '150,00 K'],
    correctIndex: 2,
    explanation:
      'Spreizung: 6,3 kJ/s / (0,1 kg/s × 4,2 kJ/(kg · K)).\nErgebnis: 15,00 K. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: '1 kW = 1 kJ/s. Teile durch Massenstrom und Wärmekapazität.',
    formula: 'ΔT = P / (ṁ · c)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-waermeleistung-v1-1',
    topicId: 'heizung',
    title: 'Wärmeleistung eines Wasserkreises · Variante 1',
    context:
      'Stationär fließen 0,2 kg/s Wasser bei 15 K Spreizung. Es gilt c = 4,2 kJ/(kg · K). Keine Verluste und keine Phasenänderung.',
    question:
      'Wie groß ist die übertragene Wärmeleistung? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['6,30 kW', '12,60 kW', '25,20 kW', '126,00 kW'],
    correctIndex: 1,
    explanation:
      'Leistung: 0,2 kg/s × 4,2 kJ/(kg · K) × 15 K.\nErgebnis: 12,60 kW. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Das Produkt ergibt kJ/s, also kW.',
    formula: 'P = ṁ · c · ΔT',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-waermeleistung-v1-2',
    topicId: 'heizung',
    title: 'Wärmeleistung eines Wasserkreises · Variante 2',
    context:
      'Stationär fließen 0,3 kg/s Wasser bei 20 K Spreizung. Es gilt c = 4,2 kJ/(kg · K). Keine Verluste und keine Phasenänderung.',
    question:
      'Wie groß ist die übertragene Wärmeleistung? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['12,60 kW', '50,40 kW', '252,00 kW', '25,20 kW'],
    correctIndex: 3,
    explanation:
      'Leistung: 0,3 kg/s × 4,2 kJ/(kg · K) × 20 K.\nErgebnis: 25,20 kW. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Das Produkt ergibt kJ/s, also kW.',
    formula: 'P = ṁ · c · ΔT',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-waermeleistung-v1-3',
    topicId: 'heizung',
    title: 'Wärmeleistung eines Wasserkreises · Variante 3',
    context:
      'Stationär fließen 0,1 kg/s Wasser bei 25 K Spreizung. Es gilt c = 4,2 kJ/(kg · K). Keine Verluste und keine Phasenänderung.',
    question:
      'Wie groß ist die übertragene Wärmeleistung? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['5,25 kW', '10,50 kW', '21,00 kW', '105,00 kW'],
    correctIndex: 1,
    explanation:
      'Leistung: 0,1 kg/s × 4,2 kJ/(kg · K) × 25 K.\nErgebnis: 10,50 kW. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Das Produkt ergibt kJ/s, also kW.',
    formula: 'P = ṁ · c · ΔT',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-ausdehnung-v1-1',
    topicId: 'heizung',
    title: 'Längenausdehnung im Modell · Variante 1',
    context:
      'Ein frei bewegliches gerades Rohr ist 10 m lang und wird um 40 K wärmer. Vorgegeben ist α = 0,017 mm/(m · K), konstant. Keine mechanischen Zwänge.',
    question:
      'Um wie viele Millimeter verlängert es sich? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['6,80 mm', '3,40 mm', '13,60 mm', '68,00 mm'],
    correctIndex: 0,
    explanation:
      'Längenänderung: 0,017 mm/(m · K) × 10 m × 40 K. Keine Aussage über eine reale Befestigung oder Kompensation.\nErgebnis: 6,80 mm. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Beachte: Der vorgegebene Koeffizient liefert bereits Millimeter.',
    formula: 'ΔL = α · L · ΔT',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-ausdehnung-v1-2',
    topicId: 'heizung',
    title: 'Längenausdehnung im Modell · Variante 2',
    context:
      'Ein frei bewegliches gerades Rohr ist 12 m lang und wird um 50 K wärmer. Vorgegeben ist α = 0,017 mm/(m · K), konstant. Keine mechanischen Zwänge.',
    question:
      'Um wie viele Millimeter verlängert es sich? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['5,10 mm', '20,40 mm', '10,20 mm', '102,00 mm'],
    correctIndex: 2,
    explanation:
      'Längenänderung: 0,017 mm/(m · K) × 12 m × 50 K. Keine Aussage über eine reale Befestigung oder Kompensation.\nErgebnis: 10,20 mm. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Beachte: Der vorgegebene Koeffizient liefert bereits Millimeter.',
    formula: 'ΔL = α · L · ΔT',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-ausdehnung-v1-3',
    topicId: 'heizung',
    title: 'Längenausdehnung im Modell · Variante 3',
    context:
      'Ein frei bewegliches gerades Rohr ist 8 m lang und wird um 30 K wärmer. Vorgegeben ist α = 0,017 mm/(m · K), konstant. Keine mechanischen Zwänge.',
    question:
      'Um wie viele Millimeter verlängert es sich? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['4,08 mm', '2,04 mm', '8,16 mm', '40,80 mm'],
    correctIndex: 0,
    explanation:
      'Längenänderung: 0,017 mm/(m · K) × 8 m × 30 K. Keine Aussage über eine reale Befestigung oder Kompensation.\nErgebnis: 4,08 mm. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Beachte: Der vorgegebene Koeffizient liefert bereits Millimeter.',
    formula: 'ΔL = α · L · ΔT',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-fuellzeit-v1-1',
    topicId: 'sanitaer',
    title: 'Füllzeit eines Behälters · Variante 1',
    context:
      'Ein zunächst leerer Behälter soll 180 l aufnehmen. Der konstante Zufluss beträgt 12 l/min. Kein Abfluss und kein Überlauf.',
    question:
      'Wie viele Minuten dauert die Füllung? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['7,50 min', '30,00 min', '150,00 min', '15,00 min'],
    correctIndex: 3,
    explanation:
      'Füllzeit: 180 l / 12 l/min.\nErgebnis: 15,00 min. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Teile das Zielvolumen durch den Volumenstrom.',
    formula: 't = V / V̇',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-fuellzeit-v1-2',
    topicId: 'sanitaer',
    title: 'Füllzeit eines Behälters · Variante 2',
    context:
      'Ein zunächst leerer Behälter soll 240 l aufnehmen. Der konstante Zufluss beträgt 16 l/min. Kein Abfluss und kein Überlauf.',
    question:
      'Wie viele Minuten dauert die Füllung? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['7,50 min', '15,00 min', '30,00 min', '150,00 min'],
    correctIndex: 1,
    explanation:
      'Füllzeit: 240 l / 16 l/min.\nErgebnis: 15,00 min. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Teile das Zielvolumen durch den Volumenstrom.',
    formula: 't = V / V̇',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-fuellzeit-v1-3',
    topicId: 'sanitaer',
    title: 'Füllzeit eines Behälters · Variante 3',
    context:
      'Ein zunächst leerer Behälter soll 150 l aufnehmen. Der konstante Zufluss beträgt 10 l/min. Kein Abfluss und kein Überlauf.',
    question:
      'Wie viele Minuten dauert die Füllung? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['7,50 min', '30,00 min', '150,00 min', '15,00 min'],
    correctIndex: 3,
    explanation:
      'Füllzeit: 150 l / 10 l/min.\nErgebnis: 15,00 min. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Teile das Zielvolumen durch den Volumenstrom.',
    formula: 't = V / V̇',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-geschwindigkeit-v1-1',
    topicId: 'sanitaer',
    title: 'Strömungsgeschwindigkeit berechnen · Variante 1',
    context:
      'Durch eine ideal kreisrunde Leitung mit 20 mm Innendurchmesser fließen stationär 0,3 l/s. Verwende π = 3,141592653589793; betrachte die mittlere Geschwindigkeit.',
    question:
      'Welche mittlere Geschwindigkeit ergibt sich? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['0,48 m/s', '1,91 m/s', '0,95 m/s', '9,55 m/s'],
    correctIndex: 2,
    explanation:
      'Querschnitt: π × (20 / 1000)² / 4 in m². Volumenstrom: 0,3 / 1000 in m³/s. Geschwindigkeit = Volumenstrom / Querschnitt.\nErgebnis: 0,95 m/s. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Wandle Millimeter in Meter und Liter in Kubikmeter um.',
    formula: 'v = V̇ / A; A = π · d² / 4',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-geschwindigkeit-v1-2',
    topicId: 'sanitaer',
    title: 'Strömungsgeschwindigkeit berechnen · Variante 2',
    context:
      'Durch eine ideal kreisrunde Leitung mit 25 mm Innendurchmesser fließen stationär 0,5 l/s. Verwende π = 3,141592653589793; betrachte die mittlere Geschwindigkeit.',
    question:
      'Welche mittlere Geschwindigkeit ergibt sich? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['1,02 m/s', '0,51 m/s', '2,04 m/s', '10,19 m/s'],
    correctIndex: 0,
    explanation:
      'Querschnitt: π × (25 / 1000)² / 4 in m². Volumenstrom: 0,5 / 1000 in m³/s. Geschwindigkeit = Volumenstrom / Querschnitt.\nErgebnis: 1,02 m/s. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Wandle Millimeter in Meter und Liter in Kubikmeter um.',
    formula: 'v = V̇ / A; A = π · d² / 4',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-geschwindigkeit-v1-3',
    topicId: 'sanitaer',
    title: 'Strömungsgeschwindigkeit berechnen · Variante 3',
    context:
      'Durch eine ideal kreisrunde Leitung mit 32 mm Innendurchmesser fließen stationär 0,8 l/s. Verwende π = 3,141592653589793; betrachte die mittlere Geschwindigkeit.',
    question:
      'Welche mittlere Geschwindigkeit ergibt sich? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['0,50 m/s', '1,99 m/s', '0,99 m/s', '9,95 m/s'],
    correctIndex: 2,
    explanation:
      'Querschnitt: π × (32 / 1000)² / 4 in m². Volumenstrom: 0,8 / 1000 in m³/s. Geschwindigkeit = Volumenstrom / Querschnitt.\nErgebnis: 0,99 m/s. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Wandle Millimeter in Meter und Liter in Kubikmeter um.',
    formula: 'v = V̇ / A; A = π · d² / 4',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-druckhoehe-v1-1',
    topicId: 'sanitaer',
    title: 'Hydrostatischer Überdruck · Variante 1',
    context:
      'Eine ruhende Wassersäule ist 5 m hoch. Setze ρ = 1000 kg/m³ und g = 9,81 m/s² an. Oberhalb wirkt Umgebungsdruck; gesucht ist nur der zusätzliche Druck der Wassersäule. 1 bar = 100000 Pa.',
    question:
      'Wie groß ist dieser Überdruck am Fuß der Säule? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['0,25 bar', '0,49 bar', '0,98 bar', '4,91 bar'],
    correctIndex: 1,
    explanation:
      'Überdruck: 1000 kg/m³ × 9,81 m/s² × 5 m / 100000 Pa/bar. Nicht der absolute Druck.\nErgebnis: 0,49 bar. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Berechne Pascal und teile für bar durch 100000.',
    formula: 'p = ρ · g · h',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-druckhoehe-v1-2',
    topicId: 'sanitaer',
    title: 'Hydrostatischer Überdruck · Variante 2',
    context:
      'Eine ruhende Wassersäule ist 12 m hoch. Setze ρ = 1000 kg/m³ und g = 9,81 m/s² an. Oberhalb wirkt Umgebungsdruck; gesucht ist nur der zusätzliche Druck der Wassersäule. 1 bar = 100000 Pa.',
    question:
      'Wie groß ist dieser Überdruck am Fuß der Säule? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['0,59 bar', '2,35 bar', '11,77 bar', '1,18 bar'],
    correctIndex: 3,
    explanation:
      'Überdruck: 1000 kg/m³ × 9,81 m/s² × 12 m / 100000 Pa/bar. Nicht der absolute Druck.\nErgebnis: 1,18 bar. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Berechne Pascal und teile für bar durch 100000.',
    formula: 'p = ρ · g · h',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-druckhoehe-v1-3',
    topicId: 'sanitaer',
    title: 'Hydrostatischer Überdruck · Variante 3',
    context:
      'Eine ruhende Wassersäule ist 20 m hoch. Setze ρ = 1000 kg/m³ und g = 9,81 m/s² an. Oberhalb wirkt Umgebungsdruck; gesucht ist nur der zusätzliche Druck der Wassersäule. 1 bar = 100000 Pa.',
    question:
      'Wie groß ist dieser Überdruck am Fuß der Säule? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['0,98 bar', '1,96 bar', '3,92 bar', '19,62 bar'],
    correctIndex: 1,
    explanation:
      'Überdruck: 1000 kg/m³ × 9,81 m/s² × 20 m / 100000 Pa/bar. Nicht der absolute Druck.\nErgebnis: 1,96 bar. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Berechne Pascal und teile für bar durch 100000.',
    formula: 'p = ρ · g · h',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-mischwasser-v1-1',
    topicId: 'sanitaer',
    title: 'Mischtemperatur von Wasser · Variante 1',
    context:
      'Es werden 10 kg Wasser mit 60 °C und 30 kg mit 20 °C gemischt. Gleiche konstante Wärmekapazität, kein Wärmeverlust, keine Behälterwärme, kein Phasenwechsel.',
    question: 'Welche Mischtemperatur entsteht? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['30,00 °C', '15,00 °C', '60,00 °C', '300,00 °C'],
    correctIndex: 0,
    explanation:
      'Gewichteter Mittelwert: (10 × 60 + 30 × 20) / (10 + 30). Das Ergebnis muss zwischen 20 und 60 °C liegen.\nErgebnis: 30,00 °C. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Gewichte beide Temperaturen mit den jeweiligen Massen.',
    formula: 'T_m = (m₁ · T₁ + m₂ · T₂) / (m₁ + m₂)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-mischwasser-v1-2',
    topicId: 'sanitaer',
    title: 'Mischtemperatur von Wasser · Variante 2',
    context:
      'Es werden 20 kg Wasser mit 60 °C und 20 kg mit 20 °C gemischt. Gleiche konstante Wärmekapazität, kein Wärmeverlust, keine Behälterwärme, kein Phasenwechsel.',
    question: 'Welche Mischtemperatur entsteht? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['20,00 °C', '80,00 °C', '40,00 °C', '400,00 °C'],
    correctIndex: 2,
    explanation:
      'Gewichteter Mittelwert: (20 × 60 + 20 × 20) / (20 + 20). Das Ergebnis muss zwischen 20 und 60 °C liegen.\nErgebnis: 40,00 °C. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Gewichte beide Temperaturen mit den jeweiligen Massen.',
    formula: 'T_m = (m₁ · T₁ + m₂ · T₂) / (m₁ + m₂)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-mischwasser-v1-3',
    topicId: 'sanitaer',
    title: 'Mischtemperatur von Wasser · Variante 3',
    context:
      'Es werden 30 kg Wasser mit 60 °C und 10 kg mit 20 °C gemischt. Gleiche konstante Wärmekapazität, kein Wärmeverlust, keine Behälterwärme, kein Phasenwechsel.',
    question: 'Welche Mischtemperatur entsteht? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['50,00 °C', '25,00 °C', '100,00 °C', '500,00 °C'],
    correctIndex: 0,
    explanation:
      'Gewichteter Mittelwert: (30 × 60 + 10 × 20) / (30 + 10). Das Ergebnis muss zwischen 20 und 60 °C liegen.\nErgebnis: 50,00 °C. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Gewichte beide Temperaturen mit den jeweiligen Massen.',
    formula: 'T_m = (m₁ · T₁ + m₂ · T₂) / (m₁ + m₂)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-gefaelle-rueckwaerts-v1-1',
    topicId: 'sanitaer',
    title: 'Gefälle aus Höhenunterschied · Variante 1',
    context:
      'Eine reine Geometrieaufgabe: Auf 6 m waagerechter Bezugslänge beträgt der Höhenunterschied 12 cm. Keine Auslegungsvorgabe für reale Leitungen.',
    question:
      'Wie groß ist das Gefälle in Prozent? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['1,00 %', '4,00 %', '20,00 %', '2,00 %'],
    correctIndex: 3,
    explanation:
      'Höhe in Metern: 12 / 100. Gefälle: (12 / 100) / 6 × 100 %.\nErgebnis: 2,00 %. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Bringe Höhe und Bezugslänge zuerst auf dieselbe Einheit.',
    formula: 'i = h / L · 100 %',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-gefaelle-rueckwaerts-v1-2',
    topicId: 'sanitaer',
    title: 'Gefälle aus Höhenunterschied · Variante 2',
    context:
      'Eine reine Geometrieaufgabe: Auf 8 m waagerechter Bezugslänge beträgt der Höhenunterschied 12 cm. Keine Auslegungsvorgabe für reale Leitungen.',
    question:
      'Wie groß ist das Gefälle in Prozent? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['0,75 %', '1,50 %', '3,00 %', '15,00 %'],
    correctIndex: 1,
    explanation:
      'Höhe in Metern: 12 / 100. Gefälle: (12 / 100) / 8 × 100 %.\nErgebnis: 1,50 %. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Bringe Höhe und Bezugslänge zuerst auf dieselbe Einheit.',
    formula: 'i = h / L · 100 %',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-gefaelle-rueckwaerts-v1-3',
    topicId: 'sanitaer',
    title: 'Gefälle aus Höhenunterschied · Variante 3',
    context:
      'Eine reine Geometrieaufgabe: Auf 10 m waagerechter Bezugslänge beträgt der Höhenunterschied 25 cm. Keine Auslegungsvorgabe für reale Leitungen.',
    question:
      'Wie groß ist das Gefälle in Prozent? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['1,25 %', '5,00 %', '25,00 %', '2,50 %'],
    correctIndex: 3,
    explanation:
      'Höhe in Metern: 25 / 100. Gefälle: (25 / 100) / 10 × 100 %.\nErgebnis: 2,50 %. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Bringe Höhe und Bezugslänge zuerst auf dieselbe Einheit.',
    formula: 'i = h / L · 100 %',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-verbrauch-v1-1',
    topicId: 'sanitaer',
    title: 'Tagesverbrauch im Rechenmodell · Variante 1',
    context:
      'Eine Modellzapfstelle läuft pro Nutzung 3 Minuten mit konstant 6 l/min. Sie wird täglich genau 4-mal benutzt, sonst kein Verbrauch.',
    question: 'Wie groß ist der Tagesverbrauch? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['36,00 l', '144,00 l', '72,00 l', '720,00 l'],
    correctIndex: 2,
    explanation:
      'Volumen je Nutzung: 3 min × 6 l/min. Tagesmenge: dieses Volumen × 4.\nErgebnis: 72,00 l. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Berechne zuerst das Volumen einer Nutzung.',
    formula: 'V = V̇ · t · Anzahl',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-verbrauch-v1-2',
    topicId: 'sanitaer',
    title: 'Tagesverbrauch im Rechenmodell · Variante 2',
    context:
      'Eine Modellzapfstelle läuft pro Nutzung 2 Minuten mit konstant 8 l/min. Sie wird täglich genau 5-mal benutzt, sonst kein Verbrauch.',
    question: 'Wie groß ist der Tagesverbrauch? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['80,00 l', '40,00 l', '160,00 l', '800,00 l'],
    correctIndex: 0,
    explanation:
      'Volumen je Nutzung: 2 min × 8 l/min. Tagesmenge: dieses Volumen × 5.\nErgebnis: 80,00 l. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Berechne zuerst das Volumen einer Nutzung.',
    formula: 'V = V̇ · t · Anzahl',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-verbrauch-v1-3',
    topicId: 'sanitaer',
    title: 'Tagesverbrauch im Rechenmodell · Variante 3',
    context:
      'Eine Modellzapfstelle läuft pro Nutzung 4 Minuten mit konstant 5 l/min. Sie wird täglich genau 3-mal benutzt, sonst kein Verbrauch.',
    question: 'Wie groß ist der Tagesverbrauch? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['30,00 l', '120,00 l', '60,00 l', '600,00 l'],
    correctIndex: 2,
    explanation:
      'Volumen je Nutzung: 4 min × 5 l/min. Tagesmenge: dieses Volumen × 3.\nErgebnis: 60,00 l. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Berechne zuerst das Volumen einer Nutzung.',
    formula: 'V = V̇ · t · Anzahl',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-luftbedarf-v1-1',
    topicId: 'klima',
    title: 'Volumenstrom bei gegebenem Luftwechsel · Variante 1',
    context:
      'Ein Modellraum hat 60 m³. Für die Rechnung ist n = 3 h⁻¹ vorgegeben, keine normative Luftwechselanforderung. Stationär gleiche Zu- und Abluft.',
    question:
      'Welcher Außenluftvolumenstrom gehört dazu? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['90,00 m³/h', '180,00 m³/h', '360,00 m³/h', '1800,00 m³/h'],
    correctIndex: 1,
    explanation:
      'Volumenstrom: 60 m³ × 3 h⁻¹. Die Rechnung bewertet keine Luftqualität.\nErgebnis: 180,00 m³/h. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Multipliziere Raumvolumen und rechnerischen Luftwechsel.',
    formula: 'V̇ = n · V',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-luftbedarf-v1-2',
    topicId: 'klima',
    title: 'Volumenstrom bei gegebenem Luftwechsel · Variante 2',
    context:
      'Ein Modellraum hat 90 m³. Für die Rechnung ist n = 2 h⁻¹ vorgegeben, keine normative Luftwechselanforderung. Stationär gleiche Zu- und Abluft.',
    question:
      'Welcher Außenluftvolumenstrom gehört dazu? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['90,00 m³/h', '360,00 m³/h', '1800,00 m³/h', '180,00 m³/h'],
    correctIndex: 3,
    explanation:
      'Volumenstrom: 90 m³ × 2 h⁻¹. Die Rechnung bewertet keine Luftqualität.\nErgebnis: 180,00 m³/h. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Multipliziere Raumvolumen und rechnerischen Luftwechsel.',
    formula: 'V̇ = n · V',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-luftbedarf-v1-3',
    topicId: 'klima',
    title: 'Volumenstrom bei gegebenem Luftwechsel · Variante 3',
    context:
      'Ein Modellraum hat 120 m³. Für die Rechnung ist n = 2,5 h⁻¹ vorgegeben, keine normative Luftwechselanforderung. Stationär gleiche Zu- und Abluft.',
    question:
      'Welcher Außenluftvolumenstrom gehört dazu? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['150,00 m³/h', '300,00 m³/h', '600,00 m³/h', '3000,00 m³/h'],
    correctIndex: 1,
    explanation:
      'Volumenstrom: 120 m³ × 2,5 h⁻¹. Die Rechnung bewertet keine Luftqualität.\nErgebnis: 300,00 m³/h. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Multipliziere Raumvolumen und rechnerischen Luftwechsel.',
    formula: 'V̇ = n · V',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-kanalquerschnitt-v1-1',
    topicId: 'klima',
    title: 'Rechteckigen Kanalquerschnitt berechnen · Variante 1',
    context:
      'Ein gerader Rechteckkanal ist innen 400 mm breit und 200 mm hoch. Wandstärken und Einbauten gehören nicht zum freien Querschnitt.',
    question:
      'Wie groß ist der freie Querschnitt? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['0,08 m²', '0,04 m²', '0,16 m²', '0,80 m²'],
    correctIndex: 0,
    explanation:
      'Breite: 400 / 1000 m. Höhe: 200 / 1000 m. Fläche = Breite × Höhe; mm² werden durch 1000000 in m² umgerechnet.\nErgebnis: 0,08 m². Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Wandle beide Längen in Meter um, bevor du multiplizierst.',
    formula: 'A = b · h',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-kanalquerschnitt-v1-2',
    topicId: 'klima',
    title: 'Rechteckigen Kanalquerschnitt berechnen · Variante 2',
    context:
      'Ein gerader Rechteckkanal ist innen 500 mm breit und 300 mm hoch. Wandstärken und Einbauten gehören nicht zum freien Querschnitt.',
    question:
      'Wie groß ist der freie Querschnitt? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['0,07 m²', '0,30 m²', '0,15 m²', '1,50 m²'],
    correctIndex: 2,
    explanation:
      'Breite: 500 / 1000 m. Höhe: 300 / 1000 m. Fläche = Breite × Höhe; mm² werden durch 1000000 in m² umgerechnet.\nErgebnis: 0,15 m². Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Wandle beide Längen in Meter um, bevor du multiplizierst.',
    formula: 'A = b · h',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-kanalquerschnitt-v1-3',
    topicId: 'klima',
    title: 'Rechteckigen Kanalquerschnitt berechnen · Variante 3',
    context:
      'Ein gerader Rechteckkanal ist innen 600 mm breit und 250 mm hoch. Wandstärken und Einbauten gehören nicht zum freien Querschnitt.',
    question:
      'Wie groß ist der freie Querschnitt? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['0,15 m²', '0,07 m²', '0,30 m²', '1,50 m²'],
    correctIndex: 0,
    explanation:
      'Breite: 600 / 1000 m. Höhe: 250 / 1000 m. Fläche = Breite × Höhe; mm² werden durch 1000000 in m² umgerechnet.\nErgebnis: 0,15 m². Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Wandle beide Längen in Meter um, bevor du multiplizierst.',
    formula: 'A = b · h',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-kanalstrom-v1-1',
    topicId: 'klima',
    title: 'Luftvolumenstrom aus Geschwindigkeit · Variante 1',
    context:
      'Die mittlere Luftgeschwindigkeit beträgt 3 m/s im freien Querschnitt von 0,08 m². Stationäre Strömung, gleichmäßiger Modellquerschnitt.',
    question:
      'Welcher Volumenstrom ergibt sich pro Stunde? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['432,00 m³/h', '1728,00 m³/h', '8640,00 m³/h', '864,00 m³/h'],
    correctIndex: 3,
    explanation:
      'Volumenstrom: 3 m/s × 0,08 m² × 3600 s/h.\nErgebnis: 864,00 m³/h. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Das Produkt ergibt m³/s. Rechne anschließend auf eine Stunde um.',
    formula: 'V̇ = v · A',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-kanalstrom-v1-2',
    topicId: 'klima',
    title: 'Luftvolumenstrom aus Geschwindigkeit · Variante 2',
    context:
      'Die mittlere Luftgeschwindigkeit beträgt 4 m/s im freien Querschnitt von 0,12 m². Stationäre Strömung, gleichmäßiger Modellquerschnitt.',
    question:
      'Welcher Volumenstrom ergibt sich pro Stunde? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['864,00 m³/h', '1728,00 m³/h', '3456,00 m³/h', '17280,00 m³/h'],
    correctIndex: 1,
    explanation:
      'Volumenstrom: 4 m/s × 0,12 m² × 3600 s/h.\nErgebnis: 1728,00 m³/h. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Das Produkt ergibt m³/s. Rechne anschließend auf eine Stunde um.',
    formula: 'V̇ = v · A',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-kanalstrom-v1-3',
    topicId: 'klima',
    title: 'Luftvolumenstrom aus Geschwindigkeit · Variante 3',
    context:
      'Die mittlere Luftgeschwindigkeit beträgt 2,5 m/s im freien Querschnitt von 0,16 m². Stationäre Strömung, gleichmäßiger Modellquerschnitt.',
    question:
      'Welcher Volumenstrom ergibt sich pro Stunde? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['720,00 m³/h', '2880,00 m³/h', '14400,00 m³/h', '1440,00 m³/h'],
    correctIndex: 3,
    explanation:
      'Volumenstrom: 2,5 m/s × 0,16 m² × 3600 s/h.\nErgebnis: 1440,00 m³/h. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Das Produkt ergibt m³/s. Rechne anschließend auf eine Stunde um.',
    formula: 'V̇ = v · A',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-luftwaerme-v1-1',
    topicId: 'klima',
    title: 'Luft erwärmen · Variante 1',
    context:
      'Ein trockener Luftmassenstrom von 0,5 kg/s wird um 20 K erwärmt. Setze c = 1,0 kJ/(kg · K) konstant an, ohne Verluste, Feuchteänderung und Phasenwechsel.',
    question:
      'Welche Heizleistung wird im Modell benötigt? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['5,00 kW', '20,00 kW', '10,00 kW', '100,00 kW'],
    correctIndex: 2,
    explanation:
      'Heizleistung: 0,5 kg/s × 1,0 kJ/(kg · K) × 20 K. Ergebnis in kJ/s = kW.\nErgebnis: 10,00 kW. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Verwende den ausdrücklich vorgegebenen Wert für Luft, nicht für Wasser.',
    formula: 'P = ṁ · c · ΔT',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-luftwaerme-v1-2',
    topicId: 'klima',
    title: 'Luft erwärmen · Variante 2',
    context:
      'Ein trockener Luftmassenstrom von 0,8 kg/s wird um 15 K erwärmt. Setze c = 1,0 kJ/(kg · K) konstant an, ohne Verluste, Feuchteänderung und Phasenwechsel.',
    question:
      'Welche Heizleistung wird im Modell benötigt? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['12,00 kW', '6,00 kW', '24,00 kW', '120,00 kW'],
    correctIndex: 0,
    explanation:
      'Heizleistung: 0,8 kg/s × 1,0 kJ/(kg · K) × 15 K. Ergebnis in kJ/s = kW.\nErgebnis: 12,00 kW. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Verwende den ausdrücklich vorgegebenen Wert für Luft, nicht für Wasser.',
    formula: 'P = ṁ · c · ΔT',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-luftwaerme-v1-3',
    topicId: 'klima',
    title: 'Luft erwärmen · Variante 3',
    context:
      'Ein trockener Luftmassenstrom von 1,2 kg/s wird um 10 K erwärmt. Setze c = 1,0 kJ/(kg · K) konstant an, ohne Verluste, Feuchteänderung und Phasenwechsel.',
    question:
      'Welche Heizleistung wird im Modell benötigt? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['6,00 kW', '24,00 kW', '12,00 kW', '120,00 kW'],
    correctIndex: 2,
    explanation:
      'Heizleistung: 1,2 kg/s × 1,0 kJ/(kg · K) × 10 K. Ergebnis in kJ/s = kW.\nErgebnis: 12,00 kW. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Verwende den ausdrücklich vorgegebenen Wert für Luft, nicht für Wasser.',
    formula: 'P = ṁ · c · ΔT',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-rueckwaermzahl-v1-1',
    topicId: 'klima',
    title: 'Zulufttemperatur im Wärmetauschermodell · Variante 1',
    context:
      'Außenluft mit 2 °C wird durch Abluft mit 22 °C erwärmt. Im vereinfachten trockenen Modell gilt eine Temperaturübertragungszahl von 75 %. Keine Leckage, Ventilatorwärme oder Phasenänderung.',
    question:
      'Welche Zulufttemperatur folgt nach T_zu = T_außen + η · (T_ab − T_außen)? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['8,50 °C', '17,00 °C', '34,00 °C', '170,00 °C'],
    correctIndex: 1,
    explanation:
      'Zulufttemperatur: 2 + (75 / 100) × (22 − (2)). Die Temperatur liegt zwischen Außenluft und Abluft.\nErgebnis: 17,00 °C. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Wende den Prozentwert auf die Temperaturdifferenz an.',
    formula: 'T_zu = T_außen + η · (T_ab − T_außen)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-rueckwaermzahl-v1-2',
    topicId: 'klima',
    title: 'Zulufttemperatur im Wärmetauschermodell · Variante 2',
    context:
      'Außenluft mit -2 °C wird durch Abluft mit 22 °C erwärmt. Im vereinfachten trockenen Modell gilt eine Temperaturübertragungszahl von 80 %. Keine Leckage, Ventilatorwärme oder Phasenänderung.',
    question:
      'Welche Zulufttemperatur folgt nach T_zu = T_außen + η · (T_ab − T_außen)? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['8,60 °C', '34,40 °C', '172,00 °C', '17,20 °C'],
    correctIndex: 3,
    explanation:
      'Zulufttemperatur: -2 + (80 / 100) × (22 − (-2)). Die Temperatur liegt zwischen Außenluft und Abluft.\nErgebnis: 17,20 °C. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Wende den Prozentwert auf die Temperaturdifferenz an.',
    formula: 'T_zu = T_außen + η · (T_ab − T_außen)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-rueckwaermzahl-v1-3',
    topicId: 'klima',
    title: 'Zulufttemperatur im Wärmetauschermodell · Variante 3',
    context:
      'Außenluft mit 6 °C wird durch Abluft mit 22 °C erwärmt. Im vereinfachten trockenen Modell gilt eine Temperaturübertragungszahl von 50 %. Keine Leckage, Ventilatorwärme oder Phasenänderung.',
    question:
      'Welche Zulufttemperatur folgt nach T_zu = T_außen + η · (T_ab − T_außen)? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['7,00 °C', '14,00 °C', '28,00 °C', '140,00 °C'],
    correctIndex: 1,
    explanation:
      'Zulufttemperatur: 6 + (50 / 100) × (22 − (6)). Die Temperatur liegt zwischen Außenluft und Abluft.\nErgebnis: 14,00 °C. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Wende den Prozentwert auf die Temperaturdifferenz an.',
    formula: 'T_zu = T_außen + η · (T_ab − T_außen)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-luftenergie-v1-1',
    topicId: 'klima',
    title: 'Ventilatorenergie · Variante 1',
    context:
      'Ein Ventilator nimmt konstant 80 W elektrische Wirkleistung auf und läuft 10 Stunden. Keine weiteren Verbraucher, keine Leistungsänderung.',
    question:
      'Wie viel elektrische Energie verbraucht er? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['0,80 kWh', '0,40 kWh', '1,60 kWh', '8,00 kWh'],
    correctIndex: 0,
    explanation:
      'Energie: (80 W / 1000) × 10 h. Leistung und Energie sind unterschiedliche Größen.\nErgebnis: 0,80 kWh. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Wandle Watt zuerst in Kilowatt um.',
    formula: 'E = P · t',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-luftenergie-v1-2',
    topicId: 'klima',
    title: 'Ventilatorenergie · Variante 2',
    context:
      'Ein Ventilator nimmt konstant 120 W elektrische Wirkleistung auf und läuft 8 Stunden. Keine weiteren Verbraucher, keine Leistungsänderung.',
    question:
      'Wie viel elektrische Energie verbraucht er? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['0,48 kWh', '1,92 kWh', '0,96 kWh', '9,60 kWh'],
    correctIndex: 2,
    explanation:
      'Energie: (120 W / 1000) × 8 h. Leistung und Energie sind unterschiedliche Größen.\nErgebnis: 0,96 kWh. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Wandle Watt zuerst in Kilowatt um.',
    formula: 'E = P · t',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-luftenergie-v1-3',
    topicId: 'klima',
    title: 'Ventilatorenergie · Variante 3',
    context:
      'Ein Ventilator nimmt konstant 150 W elektrische Wirkleistung auf und läuft 6 Stunden. Keine weiteren Verbraucher, keine Leistungsänderung.',
    question:
      'Wie viel elektrische Energie verbraucht er? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['0,90 kWh', '0,45 kWh', '1,80 kWh', '9,00 kWh'],
    correctIndex: 0,
    explanation:
      'Energie: (150 W / 1000) × 6 h. Leistung und Energie sind unterschiedliche Größen.\nErgebnis: 0,90 kWh. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Wandle Watt zuerst in Kilowatt um.',
    formula: 'E = P · t',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-stundenkosten-v1-1',
    topicId: 'wiso',
    title: 'Arbeitskosten kalkulieren · Variante 1',
    context:
      'Ein fiktiver Nettoverrechnungssatz beträgt 58 €/h. Für einen Auftrag sind 3,5 Arbeitsstunden vorgegeben. Keine Materialkosten, Zuschläge oder Steuern.',
    question:
      'Wie hoch sind die kalkulierten Nettoarbeitskosten? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['101,50 €', '406,00 €', '2030,00 €', '203,00 €'],
    correctIndex: 3,
    explanation:
      'Arbeitskosten: 58 €/h × 3,5 h. Der Verrechnungssatz ist keine Aussage zum persönlichen Stundenlohn.\nErgebnis: 203,00 €. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Multipliziere Stunden und Euro pro Stunde.',
    formula: 'Kosten = Satz · Zeit',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-stundenkosten-v1-2',
    topicId: 'wiso',
    title: 'Arbeitskosten kalkulieren · Variante 2',
    context:
      'Ein fiktiver Nettoverrechnungssatz beträgt 64 €/h. Für einen Auftrag sind 2,25 Arbeitsstunden vorgegeben. Keine Materialkosten, Zuschläge oder Steuern.',
    question:
      'Wie hoch sind die kalkulierten Nettoarbeitskosten? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['72,00 €', '144,00 €', '288,00 €', '1440,00 €'],
    correctIndex: 1,
    explanation:
      'Arbeitskosten: 64 €/h × 2,25 h. Der Verrechnungssatz ist keine Aussage zum persönlichen Stundenlohn.\nErgebnis: 144,00 €. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Multipliziere Stunden und Euro pro Stunde.',
    formula: 'Kosten = Satz · Zeit',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-stundenkosten-v1-3',
    topicId: 'wiso',
    title: 'Arbeitskosten kalkulieren · Variante 3',
    context:
      'Ein fiktiver Nettoverrechnungssatz beträgt 72 €/h. Für einen Auftrag sind 4,5 Arbeitsstunden vorgegeben. Keine Materialkosten, Zuschläge oder Steuern.',
    question:
      'Wie hoch sind die kalkulierten Nettoarbeitskosten? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['162,00 €', '648,00 €', '3240,00 €', '324,00 €'],
    correctIndex: 3,
    explanation:
      'Arbeitskosten: 72 €/h × 4,5 h. Der Verrechnungssatz ist keine Aussage zum persönlichen Stundenlohn.\nErgebnis: 324,00 €. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Multipliziere Stunden und Euro pro Stunde.',
    formula: 'Kosten = Satz · Zeit',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-materialzuschlag-v1-1',
    topicId: 'wiso',
    title: 'Material mit Zuschlag · Variante 1',
    context:
      'Der Materialeinkauf kostet netto 160 €. Der fiktive Zuschlag beträgt 25 % auf diesen Einkaufspreis. Keine weiteren Kosten oder Steuern.',
    question:
      'Wie hoch ist der kalkulierte Nettoverkaufspreis? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['100,00 €', '400,00 €', '200,00 €', '2000,00 €'],
    correctIndex: 2,
    explanation:
      'Nettoverkaufspreis: 160 € × (1 + 25 / 100). Ein Zuschlag auf den Einkaufspreis ist nicht derselbe Prozentsatz wie eine Marge vom Verkaufspreis.\nErgebnis: 200,00 €. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Der Zuschlag bezieht sich auf den Einkaufspreis.',
    formula: 'Verkaufspreis = Einkaufspreis · (1 + p / 100)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-materialzuschlag-v1-2',
    topicId: 'wiso',
    title: 'Material mit Zuschlag · Variante 2',
    context:
      'Der Materialeinkauf kostet netto 240 €. Der fiktive Zuschlag beträgt 20 % auf diesen Einkaufspreis. Keine weiteren Kosten oder Steuern.',
    question:
      'Wie hoch ist der kalkulierte Nettoverkaufspreis? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['288,00 €', '144,00 €', '576,00 €', '2880,00 €'],
    correctIndex: 0,
    explanation:
      'Nettoverkaufspreis: 240 € × (1 + 20 / 100). Ein Zuschlag auf den Einkaufspreis ist nicht derselbe Prozentsatz wie eine Marge vom Verkaufspreis.\nErgebnis: 288,00 €. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Der Zuschlag bezieht sich auf den Einkaufspreis.',
    formula: 'Verkaufspreis = Einkaufspreis · (1 + p / 100)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-materialzuschlag-v1-3',
    topicId: 'wiso',
    title: 'Material mit Zuschlag · Variante 3',
    context:
      'Der Materialeinkauf kostet netto 320 €. Der fiktive Zuschlag beträgt 15 % auf diesen Einkaufspreis. Keine weiteren Kosten oder Steuern.',
    question:
      'Wie hoch ist der kalkulierte Nettoverkaufspreis? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['184,00 €', '736,00 €', '368,00 €', '3680,00 €'],
    correctIndex: 2,
    explanation:
      'Nettoverkaufspreis: 320 € × (1 + 15 / 100). Ein Zuschlag auf den Einkaufspreis ist nicht derselbe Prozentsatz wie eine Marge vom Verkaufspreis.\nErgebnis: 368,00 €. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Der Zuschlag bezieht sich auf den Einkaufspreis.',
    formula: 'Verkaufspreis = Einkaufspreis · (1 + p / 100)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-skonto-v1-1',
    topicId: 'wiso',
    title: 'Vorgegebenes Skonto · Variante 1',
    context:
      'Ein fiktiver Zahlbetrag von 500 € darf laut Aufgabenannahme um 2 % Skonto gekürzt werden. Alle Bedingungen seien erfüllt. Keine weiteren Korrekturen.',
    question: 'Welcher Betrag wird überwiesen? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['245,00 €', '490,00 €', '980,00 €', '4900,00 €'],
    correctIndex: 1,
    explanation:
      'Zahlung: 500 € × (1 − 2 / 100). Die Konditionen sind reine Aufgabenannahmen, keine allgemeinen Zahlungsansprüche.\nErgebnis: 490,00 €. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Gesucht ist die Zahlung nach Abzug, nicht nur der Abzug.',
    formula: 'Zahlung = Betrag · (1 − p / 100)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-skonto-v1-2',
    topicId: 'wiso',
    title: 'Vorgegebenes Skonto · Variante 2',
    context:
      'Ein fiktiver Zahlbetrag von 750 € darf laut Aufgabenannahme um 3 % Skonto gekürzt werden. Alle Bedingungen seien erfüllt. Keine weiteren Korrekturen.',
    question: 'Welcher Betrag wird überwiesen? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['363,75 €', '1455,00 €', '7275,00 €', '727,50 €'],
    correctIndex: 3,
    explanation:
      'Zahlung: 750 € × (1 − 3 / 100). Die Konditionen sind reine Aufgabenannahmen, keine allgemeinen Zahlungsansprüche.\nErgebnis: 727,50 €. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Gesucht ist die Zahlung nach Abzug, nicht nur der Abzug.',
    formula: 'Zahlung = Betrag · (1 − p / 100)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-skonto-v1-3',
    topicId: 'wiso',
    title: 'Vorgegebenes Skonto · Variante 3',
    context:
      'Ein fiktiver Zahlbetrag von 1200 € darf laut Aufgabenannahme um 2 % Skonto gekürzt werden. Alle Bedingungen seien erfüllt. Keine weiteren Korrekturen.',
    question: 'Welcher Betrag wird überwiesen? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['588,00 €', '1176,00 €', '2352,00 €', '11760,00 €'],
    correctIndex: 1,
    explanation:
      'Zahlung: 1200 € × (1 − 2 / 100). Die Konditionen sind reine Aufgabenannahmen, keine allgemeinen Zahlungsansprüche.\nErgebnis: 1176,00 €. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Gesucht ist die Zahlung nach Abzug, nicht nur der Abzug.',
    formula: 'Zahlung = Betrag · (1 − p / 100)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-kostendeckung-v1-1',
    topicId: 'wiso',
    title: 'Kostendeckende Stückzahl · Variante 1',
    context:
      'Fiktive monatliche Fixkosten: 1500 €. Pro verkauftem Stück entstehen 30 € Deckungsbeitrag. Konstante Preise und variable Stückkosten; alle gefertigten Stücke werden verkauft.',
    question:
      'Welche Stückzahl deckt genau die Fixkosten? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['50,00 Stück', '25,00 Stück', '100,00 Stück', '500,00 Stück'],
    correctIndex: 0,
    explanation:
      'Kostendeckende Menge: 1500 € / 30 €/Stück. An diesem Punkt ist im vereinfachten Modell der Gewinn null.\nErgebnis: 50,00 Stück. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Teile Fixkosten durch Deckungsbeitrag je Stück.',
    formula: 'x = Fixkosten / Stückdeckungsbeitrag',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-kostendeckung-v1-2',
    topicId: 'wiso',
    title: 'Kostendeckende Stückzahl · Variante 2',
    context:
      'Fiktive monatliche Fixkosten: 2400 €. Pro verkauftem Stück entstehen 40 € Deckungsbeitrag. Konstante Preise und variable Stückkosten; alle gefertigten Stücke werden verkauft.',
    question:
      'Welche Stückzahl deckt genau die Fixkosten? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['30,00 Stück', '120,00 Stück', '60,00 Stück', '600,00 Stück'],
    correctIndex: 2,
    explanation:
      'Kostendeckende Menge: 2400 € / 40 €/Stück. An diesem Punkt ist im vereinfachten Modell der Gewinn null.\nErgebnis: 60,00 Stück. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Teile Fixkosten durch Deckungsbeitrag je Stück.',
    formula: 'x = Fixkosten / Stückdeckungsbeitrag',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-kostendeckung-v1-3',
    topicId: 'wiso',
    title: 'Kostendeckende Stückzahl · Variante 3',
    context:
      'Fiktive monatliche Fixkosten: 3600 €. Pro verkauftem Stück entstehen 60 € Deckungsbeitrag. Konstante Preise und variable Stückkosten; alle gefertigten Stücke werden verkauft.',
    question:
      'Welche Stückzahl deckt genau die Fixkosten? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['60,00 Stück', '30,00 Stück', '120,00 Stück', '600,00 Stück'],
    correctIndex: 0,
    explanation:
      'Kostendeckende Menge: 3600 € / 60 €/Stück. An diesem Punkt ist im vereinfachten Modell der Gewinn null.\nErgebnis: 60,00 Stück. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Teile Fixkosten durch Deckungsbeitrag je Stück.',
    formula: 'x = Fixkosten / Stückdeckungsbeitrag',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-preissteigerung-v1-1',
    topicId: 'wiso',
    title: 'Preisänderung in Prozent · Variante 1',
    context:
      'Ein fiktiver Nettopreis steigt von 80 € auf 92 €. Gleiche Menge und Leistung, keine weiteren Änderungen.',
    question:
      'Um wie viel Prozent steigt der Preis bezogen auf den alten Wert? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['7,50 %', '30,00 %', '150,00 %', '15,00 %'],
    correctIndex: 3,
    explanation:
      'Änderung: 92 − 80 €. Prozentuale Steigerung: (92 − 80) / 80 × 100 %.\nErgebnis: 15,00 %. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Die Bezugsgröße ist der alte Preis.',
    formula: 'p = (neu − alt) / alt · 100 %',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-preissteigerung-v1-2',
    topicId: 'wiso',
    title: 'Preisänderung in Prozent · Variante 2',
    context:
      'Ein fiktiver Nettopreis steigt von 120 € auf 144 €. Gleiche Menge und Leistung, keine weiteren Änderungen.',
    question:
      'Um wie viel Prozent steigt der Preis bezogen auf den alten Wert? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['10,00 %', '20,00 %', '40,00 %', '200,00 %'],
    correctIndex: 1,
    explanation:
      'Änderung: 144 − 120 €. Prozentuale Steigerung: (144 − 120) / 120 × 100 %.\nErgebnis: 20,00 %. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Die Bezugsgröße ist der alte Preis.',
    formula: 'p = (neu − alt) / alt · 100 %',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-preissteigerung-v1-3',
    topicId: 'wiso',
    title: 'Preisänderung in Prozent · Variante 3',
    context:
      'Ein fiktiver Nettopreis steigt von 200 € auf 210 €. Gleiche Menge und Leistung, keine weiteren Änderungen.',
    question:
      'Um wie viel Prozent steigt der Preis bezogen auf den alten Wert? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['2,50 %', '10,00 %', '50,00 %', '5,00 %'],
    correctIndex: 3,
    explanation:
      'Änderung: 210 − 200 €. Prozentuale Steigerung: (210 − 200) / 200 × 100 %.\nErgebnis: 5,00 %. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Die Bezugsgröße ist der alte Preis.',
    formula: 'p = (neu − alt) / alt · 100 %',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-energiekosten-v1-1',
    topicId: 'wiso',
    title: 'Energiekosten eines Modellgeräts · Variante 1',
    context:
      'Ein Gerät nimmt konstant 2 kW auf und läuft 5 h. Für diese Rechnung kostet Energie 0,3 €/kWh. Keine Grundgebühr oder weiteren Kosten.',
    question:
      'Welche verbrauchsabhängigen Kosten entstehen? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['1,50 €', '6,00 €', '3,00 €', '30,00 €'],
    correctIndex: 2,
    explanation:
      'Energie: 2 kW × 5 h. Kosten: diese Energie × 0,3 €/kWh. Der Tarif ist fiktiv.\nErgebnis: 3,00 €. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Ermittle zuerst die Energie in kWh.',
    formula: 'Kosten = P · t · Preis',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-energiekosten-v1-2',
    topicId: 'wiso',
    title: 'Energiekosten eines Modellgeräts · Variante 2',
    context:
      'Ein Gerät nimmt konstant 1,5 kW auf und läuft 8 h. Für diese Rechnung kostet Energie 0,4 €/kWh. Keine Grundgebühr oder weiteren Kosten.',
    question:
      'Welche verbrauchsabhängigen Kosten entstehen? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['4,80 €', '2,40 €', '9,60 €', '48,00 €'],
    correctIndex: 0,
    explanation:
      'Energie: 1,5 kW × 8 h. Kosten: diese Energie × 0,4 €/kWh. Der Tarif ist fiktiv.\nErgebnis: 4,80 €. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Ermittle zuerst die Energie in kWh.',
    formula: 'Kosten = P · t · Preis',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-energiekosten-v1-3',
    topicId: 'wiso',
    title: 'Energiekosten eines Modellgeräts · Variante 3',
    context:
      'Ein Gerät nimmt konstant 3 kW auf und läuft 4 h. Für diese Rechnung kostet Energie 0,25 €/kWh. Keine Grundgebühr oder weiteren Kosten.',
    question:
      'Welche verbrauchsabhängigen Kosten entstehen? Runde das Endergebnis auf zwei Nachkommastellen.',
    options: ['1,50 €', '6,00 €', '3,00 €', '30,00 €'],
    correctIndex: 2,
    explanation:
      'Energie: 3 kW × 4 h. Kosten: diese Energie × 0,25 €/kWh. Der Tarif ist fiktiv.\nErgebnis: 3,00 €. Rechne mit ungerundeten Zwischenwerten. Die Einheit des Ergebnisses muss zur gesuchten Größe passen. Es gilt ausschließlich das beschriebene Modell.',
    hint: 'Ermittle zuerst die Energie in kWh.',
    formula: 'Kosten = P · t · Preis',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel:
      'Eigene Modellaufgabe · Eigene Übungsaufgabe · Zahlenvariante · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-energie-leistung-v1',
    topicId: 'heizung',
    title: 'Leistung und Energie',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question: 'Welche Größe beschreibt die pro Zeit übertragene Energie?',
    options: ['Leistung', 'Temperatur', 'Masse', 'Volumen'],
    correctIndex: 0,
    explanation:
      'Leistung ist Energie pro Zeit. Ein Kilowatt entspricht einem Kilojoule pro Sekunde. Kilowattstunden beschreiben dagegen eine Energiemenge.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-spreizung-begriff-v1',
    topicId: 'heizung',
    title: 'Spreizung verstehen',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question: 'Was bezeichnet die Temperaturspreizung eines Heizkreises?',
    options: [
      'Die Summe beider Temperaturen',
      'Die Differenz zwischen Vorlauf- und Rücklauftemperatur',
      'Die Rohrlänge',
      'Den absoluten Druck',
    ],
    correctIndex: 1,
    explanation:
      'Die Spreizung ist eine Temperaturdifferenz. Sie wird in Kelvin angegeben. Gleiche Zahlenwerte einer Differenz in °C und K sind dabei möglich.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-doppelte-masse-v1',
    topicId: 'heizung',
    title: 'Wassermasse verdoppeln',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question: 'Wie ändert sich Q bei doppelter Masse, gleichem c und gleicher Temperaturdifferenz?',
    options: ['Q halbiert sich', 'Q bleibt gleich', 'Q verdoppelt sich', 'Q vervierfacht sich'],
    correctIndex: 2,
    explanation:
      'Aus Q = m · c · ΔT folgt eine direkte Proportionalität zur Masse. Das gilt hier bei konstantem c und unveränderter Temperaturdifferenz ohne Phasenwechsel.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-verlustbilanz-v1',
    topicId: 'heizung',
    title: 'Energiebilanz mit Verlusten',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question:
      'Ein Speicher soll dieselbe Nutzwärme erhalten. Was bewirken zusätzliche positive Wärmeverluste?',
    options: [
      'Der Energieeinsatz sinkt',
      'Die Nutzwärme wird negativ',
      'Energie wird erzeugt',
      'Der benötigte Energieeinsatz steigt',
    ],
    correctIndex: 3,
    explanation:
      'Bei gleicher Nutzwärme muss der Wärmeerzeuger die zusätzlichen Verluste mitliefern. In der einfachen Bilanz gilt Einsatz = Nutzwärme + Verlustwärme.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-volumenstrom-trend-v1',
    topicId: 'heizung',
    title: 'Spreizung und Massenstrom',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question:
      'Was passiert bei gleicher positiver Leistung und konstantem c, wenn sich die Spreizung halbiert?',
    options: [
      'Der erforderliche Massenstrom verdoppelt sich',
      'Er halbiert sich',
      'Er bleibt gleich',
      'Er wird null',
    ],
    correctIndex: 0,
    explanation:
      'Umgestellt gilt ṁ = P / (c · ΔT). Eine halbierte positive Temperaturdifferenz erfordert daher den doppelten Massenstrom bei gleicher Wärmeleistung.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'heizung-temperatur-waerme-v1',
    topicId: 'heizung',
    title: 'Temperatur und Wärmemenge',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question:
      'Zwei Wassermengen haben dieselbe Temperatur. Was folgt daraus für ihre gespeicherte fühlbare Energie gegenüber derselben Referenz?',
    options: [
      'Beide haben immer dieselbe Energie',
      'Ohne Masse und Wärmekapazität ist kein Vergleich möglich',
      'Die kleinere Masse hat immer mehr Energie',
      'Temperatur ist bereits eine Energiemenge',
    ],
    correctIndex: 1,
    explanation:
      'Temperatur allein legt keine Energiemenge fest. Für den Vergleich gegen eine Referenz werden im einfachen Modell Masse, Wärmekapazität und Temperaturdifferenz gebraucht.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-innendurchmesser-v1',
    topicId: 'sanitaer',
    title: 'Innenmaß auswählen',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question: 'Welches Maß gehört in die Berechnung des Wasserinhalts eines kreisrunden Rohres?',
    options: [
      'Der Außendurchmesser ohne Wandstärke',
      'Nur die Nennweitenbezeichnung',
      'Der tatsächliche Innendurchmesser',
      'Nur die Dämmstärke',
    ],
    correctIndex: 2,
    explanation:
      'Das Wasser belegt den inneren freien Querschnitt. Der Außendurchmesser enthält die Rohrwand; eine Nennweitenbezeichnung ist kein exakter Innendurchmesser.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-durchmesser-quadrat-v1',
    topicId: 'sanitaer',
    title: 'Durchmesser und Rohrinhalt',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question: 'Wie verändert sich der Inhalt bei doppeltem Innendurchmesser und gleicher Länge?',
    options: ['Er verdoppelt sich', 'Er halbiert sich', 'Er bleibt gleich', 'Er vervierfacht sich'],
    correctIndex: 3,
    explanation:
      'Beim idealen Zylinder gilt V = π · d² · L / 4. Der Durchmesser geht quadratisch ein. Verdoppeln führt deshalb zum vierfachen Volumen bei gleicher Länge.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-mittelwert-v1',
    topicId: 'sanitaer',
    title: 'Schwankender Durchfluss',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question: 'Was ergibt Gesamtvolumen geteilt durch Messzeit bei schwankendem Durchfluss?',
    options: [
      'Den mittleren Volumenstrom über die Messzeit',
      'Immer den größten Volumenstrom',
      'Den Druckverlust',
      'Die Geschwindigkeit ohne Querschnitt',
    ],
    correctIndex: 0,
    explanation:
      'Die Quotientenrechnung V / t liefert einen zeitlichen Mittelwert. Einzelne Momentanwerte können darüber oder darunter liegen; ein Maximalwert folgt daraus nicht.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-druck-ruhe-v1',
    topicId: 'sanitaer',
    title: 'Druck in ruhendem Wasser',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question:
      'Was bestimmt bei gleicher Dichte und gleichem g den zusätzlichen hydrostatischen Druck?',
    options: [
      'Die waagerechte Rohrlänge allein',
      'Die vertikale Höhe der Wassersäule',
      'Die Rohrfarbe',
      'Die Fließgeschwindigkeit',
    ],
    correctIndex: 1,
    explanation:
      'Im ruhenden Fluid gilt Δp = ρ · g · h. Maßgeblich ist der vertikale Höhenunterschied. Reibungsverluste einer strömenden Leitung gehören nicht zu diesem Modell.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-gefaelle-bezug-v1',
    topicId: 'sanitaer',
    title: 'Gefälle richtig beziehen',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question: 'Welche Länge ist die Bezugsgröße beim geometrischen Prozentgefälle?',
    options: [
      'Der Rohrumfang',
      'Die senkrechte Höhe allein',
      'Die waagerechte Bezugslänge',
      'Der Radius',
    ],
    correctIndex: 2,
    explanation:
      'Das geometrische Prozentgefälle ist Höhenunterschied geteilt durch waagerechte Bezugslänge mal hundert. Beide Längen müssen in derselben Einheit stehen.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'sanitaer-mischen-grenze-v1',
    topicId: 'sanitaer',
    title: 'Mischtemperatur prüfen',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question:
      'Wo liegt die Temperatur zweier gemischter Wassermengen ohne Wärmeverlust und Phasenwechsel bei positivem c?',
    options: [
      'Immer über beiden Temperaturen',
      'Immer unter beiden Temperaturen',
      'Immer bei 0 °C',
      'Zwischen den beiden Ausgangstemperaturen',
    ],
    correctIndex: 3,
    explanation:
      'Die Energiebilanz ergibt bei gleicher konstanter Wärmekapazität einen nach Massen gewichteten Mittelwert. Ohne zusätzliche Energie liegt er zwischen den Anfangswerten.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-luftwechsel-begriff-v1',
    topicId: 'klima',
    title: 'Luftwechsel einordnen',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question: 'Was bedeutet ein rechnerischer Luftwechsel von 2 h⁻¹?',
    options: [
      'Pro Stunde strömt das Zweifache des Raumvolumens zu',
      'Jedes Luftteilchen ist nach 30 Minuten sicher ausgetauscht',
      'Die Luft hat 2 °C',
      'Der Raum ist immer hygienisch ausreichend belüftet',
    ],
    correctIndex: 0,
    explanation:
      'Der rechnerische Luftwechsel ist Volumenstrom geteilt durch Raumvolumen. Er beschreibt eine Volumenbilanz, keinen garantierten vollständigen Teilchenaustausch oder eine Luftqualitätsfreigabe.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-querschnitt-trend-v1',
    topicId: 'klima',
    title: 'Querschnitt und Geschwindigkeit',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question:
      'Wie ändert sich die mittlere Geschwindigkeit bei gleichem Volumenstrom und doppeltem freiem Querschnitt?',
    options: [
      'Sie verdoppelt sich',
      'Sie halbiert sich',
      'Sie vervierfacht sich',
      'Sie bleibt gleich',
    ],
    correctIndex: 1,
    explanation:
      'Aus V̇ = v · A folgt v = V̇ / A. Bei konstantem Volumenstrom und doppelter Fläche halbiert sich die mittlere Geschwindigkeit im stationären Modell.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-luftbilanz-v1',
    topicId: 'klima',
    title: 'Stationäre Luftbilanz',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question:
      'Welche Massenbilanz gilt im stationären Raum ohne weitere Luftwege oder Speicherung?',
    options: [
      'Zuluft immer größer',
      'Abluft immer null',
      'Zuluftmassenstrom gleich Abluftmassenstrom',
      'Die Massenbilanz hängt nur von der Raumhöhe ab',
    ],
    correctIndex: 2,
    explanation:
      'Ohne Speicherung oder weitere Luftwege muss gleich viel Luftmasse zu- wie abströmen. Gleiche Volumenströme folgen zusätzlich erst bei gleichen Dichten.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-massenstrom-gewicht-v1',
    topicId: 'klima',
    title: 'Luftströme gewichten',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question:
      'Womit gewichtet man Temperaturen bei trockener Luftmischung mit gleichem konstantem c ohne Verluste?',
    options: [
      'Nur mit den Rohrlängen',
      'Mit der Summe der Temperaturen',
      'Immer zu gleichen Teilen',
      'Mit den Massenströmen',
    ],
    correctIndex: 3,
    explanation:
      'Die stationäre Energiebilanz summiert ṁ · c · T. Bei gleichem c gewichten die Massenströme die Temperaturen; gleiche Anteile gelten nur bei gleichen Massenströmen.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-volumen-einheit-v1',
    topicId: 'klima',
    title: 'Volumen oder Volumenstrom',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question: 'Welche Einheit beschreibt einen Luftvolumenstrom?',
    options: ['m³/h', 'm³', 'm²', 'K'],
    correctIndex: 0,
    explanation:
      'Ein Volumenstrom beschreibt Volumen pro Zeit. Kubikmeter allein sind ein Volumen, Quadratmeter eine Fläche und Kelvin eine Temperatur beziehungsweise Temperaturdifferenz.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'klima-trocken-modell-v1',
    topicId: 'klima',
    title: 'Grenzen der Luftrechnung',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question: 'Was fehlt einer trockenen Luftrechnung P = ṁ · c · ΔT bei Kondensation?',
    options: [
      'Die Zahl der Kalendertage',
      'Die Energie des Phasenwechsels',
      'Die Kanalbeschriftung',
      'Die Raumfarbe',
    ],
    correctIndex: 1,
    explanation:
      'Bei Kondensation wird zusätzlich latente Wärme frei. Eine Rechnung allein mit konstanter Wärmekapazität und Temperaturdifferenz bildet diesen Energieanteil nicht ab.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-umsatz-gewinn-v1',
    topicId: 'wiso',
    title: 'Umsatz und Gewinn',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question: 'Was ist im vereinfachten Betriebsmodell Gewinn?',
    options: [
      'Umsatz ohne Kostenabzug',
      'Nur variable Kosten',
      'Umsatz minus gesamte Kosten',
      'Nur die Steuer auf einer Rechnung',
    ],
    correctIndex: 2,
    explanation:
      'Umsatz ist noch kein Gewinn. Erst nach Abzug der gesamten zugeordneten Kosten ergibt sich im vereinfachten Modell das Ergebnis; es kann auch negativ sein.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-db-fixkosten-v1',
    topicId: 'wiso',
    title: 'Deckungsbeitrag verstehen',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question: 'Wozu dient der Deckungsbeitrag zunächst?',
    options: [
      'Er entspricht immer dem Gewinn',
      'Er ist immer die Umsatzsteuer',
      'Er ist ausschließlich Materialmenge',
      'Zur Deckung der Fixkosten',
    ],
    correctIndex: 3,
    explanation:
      'Deckungsbeitrag ist Erlös minus variable Kosten. Erst nach Deckung der Fixkosten entsteht im vereinfachten Modell Gewinn. Ein positiver Beitrag allein belegt noch keinen Gesamtgewinn.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-rabatt-folge-v1',
    topicId: 'wiso',
    title: 'Aufeinanderfolgende Rabatte',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question: 'Zwei Rabatte werden nacheinander gewährt. Wie berechnet man den Endpreis?',
    options: [
      'Die jeweiligen Restpreisfaktoren nacheinander multiplizieren',
      'Die Prozentsätze immer einfach addieren',
      'Den zweiten Rabatt ignorieren',
      'Beide Rabatte vom Endpreis abziehen',
    ],
    correctIndex: 0,
    explanation:
      'Der zweite Rabatt bezieht sich auf den bereits reduzierten Preis. Deshalb werden die Faktoren (1 − p₁/100) und (1 − p₂/100) miteinander multipliziert.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-netto-brutto-v1',
    topicId: 'wiso',
    title: 'Brutto zurückrechnen',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question:
      'Wie berechnest du netto aus brutto bei einem in der Aufgabe vorgegebenen positiven Steuersatz p?',
    options: [
      'p Prozent von brutto abziehen',
      'Brutto durch (1 + p/100) teilen',
      'Brutto mit p multiplizieren',
      'Brutto und p addieren',
    ],
    correctIndex: 1,
    explanation:
      'Im Aufgabenmodell gilt brutto = netto × (1 + p/100). Zum Rückrechnen wird durch diesen Faktor geteilt. Ein Prozentabzug vom Bruttowert hat eine andere Bezugsbasis.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-fixkosten-begriff-v1',
    topicId: 'wiso',
    title: 'Fixkosten im Modell',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question:
      'Was kennzeichnet Fixkosten innerhalb eines ausdrücklich betrachteten Beschäftigungsbereichs?',
    options: [
      'Sie sind immer null',
      'Sie wachsen zwingend proportional zur Stückzahl',
      'Sie ändern sich dort nicht mit der produzierten Stückzahl',
      'Sie sind immer Materialkosten pro Stück',
    ],
    correctIndex: 2,
    explanation:
      'Fixkosten bleiben im definierten Zeitraum und Beschäftigungsbereich unabhängig von der Stückzahl. Außerhalb dieses Bereichs können Sprünge oder neue Kosten entstehen.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
  {
    id: 'wiso-zeit-dezimal-v1',
    topicId: 'wiso',
    title: 'Arbeitszeit in Dezimalstunden',
    context:
      'Selbst erstelltes Lernbeispiel. Beurteile ausschließlich den in der Frage genannten vereinfachten Zusammenhang.',
    question: 'Wie werden Minuten als Anteil einer Stunde umgerechnet?',
    options: [
      'Minuten durch 100 teilen',
      'Minuten mit 100 multiplizieren',
      'Minuten unverändert als Nachkommastellen verwenden',
      'Minuten durch 60 teilen',
    ],
    correctIndex: 3,
    explanation:
      'Eine Stunde besteht aus 60 Minuten. Für Dezimalstunden wird daher durch 60 geteilt. Eine Uhrzeitangabe mit Minuten ist keine Dezimalzahl mit Hundertstelstunden.',
    hint: 'Ordne zuerst die genannten Größen, ihre Einheiten und die Modellbedingungen zu.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel: 'Eigene Modellaufgabe · Eigene Übungsaufgabe · Version 1 · keine Originalprüfung',
  },
];
