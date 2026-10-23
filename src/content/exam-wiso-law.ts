import type { Exercise } from '../data';

// Eigene WiSo-Fälle, Inhaltsversion 1. Enger Quellenumfang und Prüfstatus:
// docs/exam-wiso-law-review.md. Keine Originalprüfungen oder Prüfungsvorhersagen.
export const wisoLawExercises: Exercise[] = [
  {
    id: 'exam-wiso-law-ausbildungsmittel',
    topicId: 'wiso',
    title: 'Fachliteratur für den Ausbildungsplan',
    context:
      'Ein 21-jähriger Auszubildender in einem SHK-Betrieb soll für seine betriebliche Ausbildung ein bestimmtes Fachbuch verwenden. Für diesen Fall steht fest: Das Buch ist für die Durchführung der Ausbildung erforderlich. Es ist keine freiwillige private Ergänzung. Die Ausbilderin möchte wissen, wer es bereitstellen muss.',
    question: 'Welche Aussage zur Bereitstellung des erforderlichen Fachbuchs trifft zu?',
    options: [
      'Der Ausbildungsbetrieb muss das erforderliche Fachbuch kostenlos zur Verfügung stellen.',
      'Der Auszubildende muss das Fachbuch selbst bezahlen, weil Fachliteratur immer Privatsache ist.',
      'Ausschließlich die Berufsschule muss das Buch beschaffen, auch wenn es für die betriebliche Ausbildung erforderlich ist.',
      'Der Betrieb muss das Buch nur dann kostenlos bereitstellen, wenn die Ausbildungsvergütung für den Kauf nicht ausreicht.',
    ],
    correctIndex: 0,
    explanation:
      'Nach § 14 Absatz 1 Nummer 3 BBiG haben Ausbildende die für die Berufsausbildung erforderlichen Ausbildungsmittel kostenlos zur Verfügung zu stellen. Fachliteratur wird in der Vorschrift ausdrücklich genannt. Im Fall ist die Erforderlichkeit vorgegeben; daher muss der Ausbildungsbetrieb das Buch kostenlos bereitstellen. Die Regel hängt nicht davon ab, ob die Ausbildungsvergütung zum Kauf reichen würde. Die Aufgabe trifft keine Aussage darüber, ob ein nur privat gewünschtes Zusatzbuch erforderlich wäre oder ob das bereitgestellte Buch in das Eigentum des Auszubildenden übergehen muss.\nPrimärquelle: BBiG § 14 Absatz 1 Nummer 3, https://www.gesetze-im-internet.de/bbig_2005/__14.html · Abruf 23.10.2026.',
    hint: 'Unterscheide eine erforderliche Ausstattung für die betriebliche Ausbildung von einer freiwilligen privaten Anschaffung.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel: 'Eigene Übungsaufgabe · v1 · BBiG § 14 Abs. 1 Nr. 3 · Abruf 23.10.2026',
  },
  {
    id: 'exam-wiso-law-berufsschulteilnahme',
    topicId: 'wiso',
    title: 'Berufsschulunterricht und betrieblicher Einsatz',
    context:
      'Eine 22-jährige Auszubildende hat am Dienstag regulären Berufsschulunterricht von 9 bis 12 Uhr. Der Unterricht findet statt. Der Betrieb möchte sie genau während dieser Zeit bei einem Kunden einsetzen und schlägt vor, den Unterrichtsstoff später zu Hause nachzuarbeiten. Gefragt ist ausschließlich die Teilnahme am Unterricht, nicht die Anrechnung eines gesamten Schultags.',
    question: 'Wie muss der Betrieb die Teilnahme am Berufsschulunterricht berücksichtigen?',
    options: [
      'Ein betrieblicher Kundenauftrag ersetzt den Unterricht, wenn die Auszubildende die Inhalte zu Hause nachliest.',
      'Der Betrieb muss die Auszubildende für die Teilnahme am Berufsschulunterricht freistellen und den kollidierenden Einsatz anders planen.',
      'Die Auszubildende muss für die Unterrichtsteilnahme private Urlaubstage einsetzen.',
      'Die Pflicht zur Freistellung für Unterrichtsteilnahme gilt ausschließlich für minderjährige Auszubildende.',
    ],
    correctIndex: 1,
    explanation:
      '§ 15 Absatz 1 Satz 2 Nummer 1 BBiG verpflichtet Ausbildende, Auszubildende für die Teilnahme am Berufsschulunterricht freizustellen. Diese Pflicht zur Unterrichtsteilnahme ist nicht auf Minderjährige beschränkt. Ein gleichzeitig geplanter Kundenauftrag oder privates Nachlesen des Stoffes ersetzt die Freistellung zur tatsächlichen Unterrichtsteilnahme nicht. Der betriebliche Einsatz muss deshalb mit der Unterrichtsteilnahme vereinbar geplant werden.\nDieser Fall bewertet weder die Anrechnung des gesamten Berufsschultags noch Unterrichtsstunden-Schwellen, Wegezeiten oder eine Beschäftigung vor beziehungsweise nach dem Unterricht.\nPrimärquelle: BBiG § 15 Absatz 1 Satz 2 Nummer 1, https://www.gesetze-im-internet.de/bbig_2005/__15.html · Abruf 23.10.2026.',
    hint: 'Trenne die tatsächliche Teilnahme am feststehenden Unterricht von der Frage, wie ein ganzer Berufsschultag zeitlich angerechnet wird.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel: 'Eigene Übungsaufgabe · v1 · BBiG § 15 Abs. 1 S. 2 Nr. 1 · Abruf 23.10.2026',
  },
  {
    id: 'exam-wiso-law-tarifvertragsparteien',
    topicId: 'wiso',
    title: 'Wer kann einen Tarifvertrag aushandeln?',
    context:
      'In mehreren SHK-Betrieben wird über gemeinsame tarifliche Arbeitsbedingungen gesprochen. Ein Auszubildender soll für eine Besprechung unterscheiden, welche Organisationen als Parteien eines Tarifvertrags auftreten können. Gesucht sind Tarifvertragsparteien, nicht die Parteien einer betrieblichen Vereinbarung.',
    question: 'Welche der folgenden Kombinationen kommt als Tarifvertragsparteien in Betracht?',
    options: [
      'Der Betriebsrat und der Betriebsinhaber',
      'Die Handwerkskammer und der Betriebsrat',
      'Eine Gewerkschaft und ein Arbeitgeberverband',
      'Die Jugend- und Auszubildendenvertretung und ein Arbeitgeberverband',
    ],
    correctIndex: 2,
    explanation:
      '§ 2 Absatz 1 TVG nennt Gewerkschaften, einzelne Arbeitgeber und Vereinigungen von Arbeitgebern als Tarifvertragsparteien. Deshalb kommt die Kombination aus Gewerkschaft und Arbeitgeberverband in Betracht. Ein Betriebsrat, eine Handwerkskammer oder eine Jugend- und Auszubildendenvertretung übernimmt dadurch nicht die in dieser Vorschrift genannte Rolle einer Gewerkschaft. Auch ein einzelner Arbeitgeber kann Tarifvertragspartei sein; ein Arbeitgeberverband ist nicht bei jedem Tarifvertrag zwingend erforderlich.\nDie Aufgabe entscheidet nicht, ob ein bestimmter Tarifvertrag für ein konkretes Arbeitsverhältnis gilt.\nPrimärquelle: TVG § 2 Absatz 1, https://www.gesetze-im-internet.de/tvg/__2.html · Abruf 23.10.2026.',
    hint: 'Achte darauf, ob nach einem Tarifvertrag oder einer Vereinbarung auf Ebene eines einzelnen Betriebs gefragt wird.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel: 'Eigene Übungsaufgabe · v1 · TVG § 2 Abs. 1 · Abruf 23.10.2026',
  },
  {
    id: 'exam-wiso-law-rentenversicherung',
    topicId: 'wiso',
    title: 'Rentenversicherung während der Ausbildung',
    context:
      'Ein 22-jähriger Auszubildender beginnt eine reguläre duale Berufsausbildung in einem SHK-Betrieb und erhält Ausbildungsvergütung. Ein Kollege behauptet, die gesetzliche Rentenversicherung beginne erst mit dem Gesellenbrief. Beurteilt wird der gewöhnliche Fall der betrieblichen Berufsausbildung; besondere Versicherungs- oder Befreiungskonstellationen sind nicht Gegenstand der Aufgabe.',
    question: 'Welche Aussage zum Versicherungsstatus trifft auf den beschriebenen Fall zu?',
    options: [
      'Die Rentenversicherungspflicht beginnt erst, wenn der Auszubildende den Gesellenbrief erhält.',
      'Während der Ausbildung ist eine Rentenversicherung nur durch einen freiwillig abgeschlossenen Einzelvertrag möglich.',
      'Die Berufsausbildung begründet erst nach dem Ende der Probezeit eine Rentenversicherungspflicht.',
      'Die betriebliche Berufsausbildung begründet im beschriebenen Fall bereits eine Pflichtversicherung in der gesetzlichen Rentenversicherung.',
    ],
    correctIndex: 3,
    explanation:
      '§ 1 Satz 1 Nummer 1 SGB VI erfasst Personen, die gegen Arbeitsentgelt oder zu ihrer Berufsausbildung beschäftigt sind. Der beschriebene reguläre Auszubildende fällt damit bereits während seiner Berufsausbildung unter die Versicherungspflicht. Ein Gesellenbrief oder das Ende der Probezeit ist nach dieser Vorschrift keine Voraussetzung. Die Pflichtversicherung entsteht im beschriebenen Fall nicht erst durch einen freiwilligen Einzelvertrag.\nDie Aufgabe macht keine Aussage zu Beitragssätzen, Beitragshöhen, besonderen Ausnahmen oder individuellen Befreiungsmöglichkeiten.\nPrimärquelle: SGB VI § 1 Satz 1 Nummer 1, https://www.gesetze-im-internet.de/sgb_6/__1.html · Abruf 23.10.2026.',
    hint: 'Prüfe, ob der Ausbildungsstatus selbst erfasst ist oder ob die behauptete Grenze erst nach dem Abschluss dafür eine Grundlage bietet.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel: 'Eigene Übungsaufgabe · v1 · SGB VI § 1 S. 1 Nr. 1 · Abruf 23.10.2026',
  },
];
