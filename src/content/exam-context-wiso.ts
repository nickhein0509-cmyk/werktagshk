import type { Exercise } from '../data';

const sourceLabel = 'Eigene Übungsaufgabe · Kontextfall · Version 1';

// Originale Fallentscheidungen unter den ausdrücklich genannten Modellregeln.
// Redaktioneller Prüfbereich: docs/exam-context-wiso-review.md.
export const wisoContextExercises: Exercise[] = [
  {
    id: 'exam-wiso-context-angebotsluecke-v1',
    kind: 'context',
    topicId: 'wiso',
    title: 'Was fehlt für einen belastbaren Angebotsvergleich?',
    context:
      'Ein SHK-Betrieb vergleicht zwei Angebote für dasselbe, technisch passende Wartungspaket. Im Modell werden der Gesamtpreis bis zum Einsatzort und ein bestätigter Liefertermin bewertet. A nennt einen niedrigen Warenpreis, lässt aber Versand und Liefertermin ausdrücklich offen. B nennt einen Gesamtpreis einschließlich Versand sowie einen bestätigten Termin. Für A ist noch keine Rückfrage erfolgt. Eine sofortige Bestellung ist nicht erforderlich.',
    question: 'Welcher nächste Schritt schafft eine vergleichbare Entscheidungsgrundlage?',
    options: [
      'Bei A Versandbetrag und Liefertermin klären; anschließend beide Angebote vollständig vergleichen.',
      'A nach dem Warenpreis vorläufig als Gesamtsieger bewerten; offene Angaben erst bei der Bestellung klären.',
      'Für A die Versandbedingungen von B einsetzen; beide beziehen sich schließlich auf dasselbe Paket.',
      'A ohne Rückfrage endgültig ausschließen; fehlende Angaben belegen bereits den ungünstigeren Gesamtpreis.',
    ],
    correctIndex: 0,
    explanation:
      'Bei A fehlen zwei für das Modell entscheidende Angaben. Deshalb ist noch kein gleichartiger Vergleich möglich. Eine gezielte Rückfrage kann die Lücke schließen, ohne bereits einen Lieferanten festzulegen. Ein niedriger Warenpreis belegt keinen niedrigeren Gesamtpreis. Die Konditionen von B dürfen nicht auf A übertragen werden. Die Lücke allein beweist umgekehrt auch nicht, dass A insgesamt teurer wäre. Bewertet wird die Entscheidungsgrundlage nach den genannten Einkaufskriterien, nicht ein rechtlicher Anspruch auf bestimmte Angebotsangaben.',
    hint: 'Welche Angaben sind bei beiden Angeboten bekannt, welche erst bei einem? Trenne einen fehlenden Wert von einem nachgewiesen ungünstigen Wert.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-context-ergebnis-zahlungsfaehigkeit-v1',
    kind: 'context',
    topicId: 'wiso',
    title: 'Gutes Auftragsergebnis, knappe Zahlungsmittel',
    context:
      'Die vereinfachte Auswertung eines SHK-Betriebs weist für einen abgeschlossenen Auftrag einen positiven Überschuss aus. Die Kundenrechnung wird laut fest vereinbartem Zahlungsplan erst im nächsten Monat bezahlt; bis dahin ist kein Eingang daraus verfügbar. Eine Materialrechnung ist bereits diese Woche fällig. Für diese Zahlung reichen die aktuell verfügbaren Zahlungsmittel nicht. Weitere mögliche Geldquellen sind noch nicht geklärt. Die Aufgabe bewertet nur diesen ausdrücklich beschriebenen Modellablauf.',
    question: 'Welche Schlussfolgerung berücksichtigt sowohl Ergebnis als auch Zahlungstermine?',
    options: [
      'Der positive Überschuss bedeutet, dass der Betrag bereits für die Materialzahlung verfügbar ist.',
      'Das Ergebnis kann positiv sein; die zeitliche Finanzierung der fälligen Zahlung ist trotzdem zu klären.',
      'Die fehlenden Zahlungsmittel beweisen, dass der abgeschlossene Auftrag einen Verlust erzeugt hat.',
      'Mit dem Ausstellen der Kundenrechnung verschiebt sich automatisch die Fälligkeit der Materialrechnung.',
    ],
    correctIndex: 1,
    explanation:
      'Das positive Auftragsergebnis und die verfügbaren Zahlungsmittel beschreiben verschiedene Sachverhalte. Laut Fall ist der spätere Kundeneingang diese Woche noch nicht verfügbar; für die frühere Materialzahlung besteht deshalb ein ungeklärter Finanzierungsbedarf. Daraus folgt nicht automatisch ein Verlust des Auftrags. Auch die Fälligkeit der Materialrechnung ändert sich durch die Kundenrechnung nicht von selbst. Die Aufgabe verlangt keine Insolvenzbeurteilung, Bilanzierungsregel oder Empfehlung für ein bestimmtes Finanzierungsprodukt.',
    hint: 'Ordne Ergebnis und tatsächlich verfügbares Geld getrennt ein. Welche Zahlung muss vor welchem Eingang möglich sein?',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-context-serviceauswertung-v1',
    kind: 'context',
    topicId: 'wiso',
    title: 'Servicedaten für die Monatsauswertung vorbereiten',
    context:
      'Für eine interne Monatsauswertung soll ein SHK-Team nur die Anzahl der Einsätze je Gerätegruppe und die mittlere Einsatzdauer vergleichen. Die vorgegebene Betriebsregel lautet: In das freigegebene Auswertungswerkzeug gelangen nur die für diesen Zweck benötigten Angaben; Kundennamen, Anschriften und freie Servicenotizen gehören nicht dazu. Die Quelldatei enthält alle diese Felder. Eine zusammengefasste Datei ohne Kundenbezug lässt sich im bestehenden Betriebssystem erstellen.',
    question: 'Welche Aufbereitung erfüllt den Auswertungszweck und die genannte Betriebsregel?',
    options: [
      'Die Quelldatei vollständig übertragen und die nicht benötigten Spalten erst nach dem Import ausblenden.',
      'Die Namen entfernen, Anschriften und freie Notizen aber als mögliche spätere Sortierhilfe übernehmen.',
      'Nur die zusammengefassten Kennzahlen je Gerätegruppe ohne Kundendaten in das Werkzeug übernehmen.',
      'Jeden Kunden durch seine Anschrift ersetzen und anschließend alle einzelnen Serviceberichte übertragen.',
    ],
    correctIndex: 2,
    explanation:
      'Die verlangten Kennzahlen reichen für den beschriebenen Vergleich aus. Die zusammengefasste Datei erfüllt deshalb den Zweck, ohne die nach der Betriebsregel ausgeschlossenen Felder mitzunehmen. Ausblenden nach dem Import verhindert deren Übertragung nicht. Anschriften oder freie Notizen werden durch das Entfernen des Namens ebenfalls nicht zu benötigten Kennzahlen. Bewertet wird ausschließlich die ausdrücklich vorgegebene Datenregel; die Aufgabe ersetzt keine rechtliche Datenschutzprüfung eines realen Systems.',
    hint: 'Leite die notwendigen Felder aus der konkreten Auswertungsfrage ab. Unterscheide „nicht sichtbar“ von „nicht übertragen“.',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-context-terminauskunft-v1',
    kind: 'context',
    topicId: 'wiso',
    title: 'Eine Terminänderung sachlich erklären',
    context:
      'Ein Kunde erwartet am Freitag den vereinbarten Austausch einer Armatur. Der Lieferant bestätigt nun: Das bestellte Bauteil kommt erst am Montag. Ob das Montageteam dann frei ist, wurde noch nicht geprüft. Im Modell gilt die Serviceregel: Betroffene Kunden werden früh über bestätigte Hindernisse informiert; ein neuer Ausführungstermin wird erst nach Material- und Personalklärung verbindlich zugesagt. Eine Eilbeschaffung ist noch nicht geprüft.',
    question: 'Welche Nachricht und weitere Bearbeitung passen zur vorgegebenen Regel?',
    options: [
      '„Der Austausch findet Montag statt.“ Die Personalklärung wird anschließend passend dazu organisiert.',
      '„Freitag bleibt bestätigt.“ Eine Nachricht erfolgt erst, falls das Bauteil am Freitag tatsächlich fehlt.',
      '„Montag ist nur eine Lieferantenvermutung.“ Der bestätigte Lieferhinweis wird vorerst nicht berücksichtigt.',
      '„Freitag ist wegen der bestätigten Lieferung gefährdet.“ Ersatzbeschaffung und Team prüfen, dann neuen Termin abstimmen.',
    ],
    correctIndex: 3,
    explanation:
      'Der Liefertermin ist als Hindernis bestätigt, ein neuer Ausführungstermin noch nicht. Die passende Bearbeitung informiert deshalb früh über den bekannten Stand und klärt die offenen Ressourcen, bevor sie einen neuen festen Termin zusagt. Ein fester Montagetermin würde eine noch unbekannte Teamverfügbarkeit voraussetzen. Abwarten bis Freitag widerspricht der frühen Information. Den bestätigten Lieferhinweis als bloße Vermutung darzustellen wäre sachlich falsch. Es wird nur die genannte Serviceregel angewendet, kein rechtlicher Verzug oder Ersatzanspruch beurteilt.',
    hint: 'Unterscheide bestätigte Tatsachen, offene Möglichkeiten und eine bereits belastbare Terminzusage.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-context-wareneingang-abgleich-v1',
    kind: 'context',
    topicId: 'wiso',
    title: 'Bestellung, Lieferschein und Rechnung passen nicht zusammen',
    context:
      'Für einen Modellauftrag wurden vier identische Regelmodule bestellt. Der bestätigte Lieferschein und die dokumentierte Warenannahme nennen übereinstimmend drei gelieferte Module. Die Lieferantenrechnung berechnet vier. Eine weitere Lieferung ist nicht dokumentiert. Laut interner Modellregel werden Rechnungsabweichungen vor der Freigabe mit Bestellung, Wareneingang und Lieferant geklärt; eine ungeprüfte Mengenänderung ist nicht zulässig.',
    question: 'Wie wird die Rechnung nach dieser Regel weiterbearbeitet?',
    options: [
      'Vier Module freigeben, weil die Bestellung wichtiger als der dokumentierte Wareneingang ist.',
      'Die Mengenabweichung dokumentieren und Lieferung sowie Rechnung vor der Freigabe klären.',
      'Den Wareneingang ohne Rückfrage auf vier ändern, damit die Unterlagen wieder übereinstimmen.',
      'Die Rechnung eigenständig auf drei Module kürzen und die Abweichung damit als vollständig geklärt behandeln.',
    ],
    correctIndex: 1,
    explanation:
      'Die Bestellung beschreibt die angeforderte Menge, nicht den Nachweis einer vollständigen Lieferung. Lieferschein und Warenannahme belegen im Fall bislang drei Module. Die Rechnung über vier erzeugt deshalb eine konkrete Klärungsaufgabe. Die vorgesehene Rückfrage kann etwa eine fehlende Lieferung oder einen Rechnungsfehler aufdecken. Ein nachträglich angepasster Wareneingang würde die dokumentierte Beobachtung verfälschen. Eine eigenständige Kürzung klärt den tatsächlichen Vorgang ebenfalls nicht. Zahlungsrechte und rechtliche Rechnungsberichtigung sind nicht Gegenstand dieser Modellregel.',
    hint: 'Welche Unterlage beschreibt eine Absicht, welche den beobachteten Eingang und welche die Abrechnung? Suche den noch ungeklärten Unterschied.',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-context-reklamationsmuster-v1',
    kind: 'context',
    topicId: 'wiso',
    title: 'Mehr Rückmeldungen – aber welches Problem häuft sich?',
    context:
      'In einem SHK-Betrieb häufen sich Einträge mit dem Sammelbegriff „Nacharbeit“. Darunter stehen bislang sehr verschiedene Fälle: falsche Liefermenge, verschobener Kundentermin und erneute Undichtigkeit. Auch die bearbeiteten Aufträge sind unterschiedlich zahlreich. Die Betriebsleitung will entscheiden, welches Problem zuerst gezielt untersucht wird. Im Modell soll eine Maßnahme erst nach einer vergleichbaren Zuordnung von Anlass und betroffenem Ablauf gewählt werden; ein konkreter Verursacher ist noch nicht nachgewiesen.',
    question: 'Welche Auswertung verbessert die Grundlage für eine gezielte Maßnahme?',
    options: [
      'Fälle nach Anlass und Ablauf getrennt erfassen und im Verhältnis zu den zugehörigen bearbeiteten Aufträgen betrachten.',
      'Alle Nacharbeiten dem Lieferanten zurechnen und die Ursachen erst nach einem Lieferantenwechsel unterscheiden.',
      'Nur die absolute Gesamtzahl verwenden; unterschiedliche Anlässe und Auftragsmengen verändern die Aussage nicht.',
      'Nur Fälle mit vollständiger Kundenunterschrift zählen und die übrigen Rückmeldungen aus der Analyse entfernen.',
    ],
    correctIndex: 0,
    explanation:
      'Der Sammelbegriff vermischt unterschiedliche Probleme. Eine einheitliche Zuordnung zu Anlass und Ablauf macht die Fälle vergleichbarer; die zugehörige Auftragsmenge hilft, eine bloße Mengenzunahme von einer höheren Fallhäufigkeit zu unterscheiden. Das beweist noch keine Ursache, erleichtert aber die gezielte nächste Untersuchung. Ein Lieferantenwechsel würde einen bislang unbelegten Verursacher voraussetzen. Die absolute Gesamtzahl allein lässt die genannten Unterschiede offen. Ein zufälliges Dokumentmerkmal ist ohne weitere Vorgabe kein fachlicher Ausschlussgrund. Es wird keine reale Mängelquote oder Verantwortlichkeit festgestellt.',
    hint: 'Prüfe, ob alle Einträge tatsächlich dasselbe Ereignis beschreiben und ob die Vergleichsgruppen gleich viel Arbeit umfassen.',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-context-persoenliche-verbindung-v1',
    kind: 'context',
    topicId: 'wiso',
    title: 'Eine persönliche Verbindung im Einkauf',
    context:
      'Eine Mitarbeiterin bereitet die Auswahl eines Materiallieferanten vor. Eines der Angebote stammt vom Betrieb ihres Bruders. Laut ausdrücklich vorgegebener Einkaufsregel werden solche persönlichen Verbindungen vor der Bewertung offengelegt; danach übernimmt eine nicht beteiligte Person die dokumentierte Entscheidung anhand derselben Kriterien. Alle Angebote sind technisch zulässig. Die Aufgabe unterstellt weder einen Vorteil noch ein Fehlverhalten der Mitarbeiterin oder des Lieferanten.',
    question: 'Welches Vorgehen wahrt den beschriebenen Entscheidungsablauf?',
    options: [
      'Das Angebot des Bruders unabhängig von den Kriterien ausschließen und die Verbindung nicht weiter festhalten.',
      'Die Mitarbeiterin entscheidet selbst; ihre besondere Kenntnis des Lieferanten ersetzt die vorgesehene Prüfung.',
      'Die persönliche Verbindung erst nach der Bestellung nennen, falls dieses Angebot tatsächlich ausgewählt wurde.',
      'Die Verbindung vor der Bewertung melden und die Entscheidung nach den Kriterien unabhängig dokumentieren lassen.',
    ],
    correctIndex: 3,
    explanation:
      'Die Einkaufsregel verlangt Offenlegung vor der Bewertung und eine Entscheidung durch eine nicht beteiligte Person. Damit bleibt eine sachliche Auswahl anhand derselben Kriterien möglich. Die persönliche Verbindung ist im Modell weder ein automatischer Ausschlussgrund noch ein Nachweis für einen unzulässigen Vorteil. Eigene Sachkenntnis oder eine erst nachträgliche Mitteilung ersetzt den vorgegebenen Ablauf nicht. Die Aufgabe bewertet nur diese Betriebsregel und trifft keine straf-, arbeits- oder vergaberechtliche Beurteilung.',
    hint: 'Unterscheide die Offenlegung einer möglichen Interessenverbindung von einer bereits bewiesenen Benachteiligung oder einem automatischen Ausschluss.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-context-vertretung-auftragswissen-v1',
    kind: 'context',
    topicId: 'wiso',
    title: 'Ein Auftrag soll auch bei Vertretung weiterlaufen',
    context:
      'Eine SHK-Disponentin fällt kurzfristig aus. Kundenzusage und Materialstatus stehen nur in ihrer persönlichen Merkliste; die benannte Vertretung findet im freigegebenen Auftragssystem lediglich den Kundennamen. Für künftige Aufträge soll der Betrieb nach folgender Modellregel arbeiten: Terminstand, Materialstatus, offene Entscheidungen und verantwortliche Rolle müssen im freigegebenen Auftragsordner für die berechtigte Vertretung nachvollziehbar sein. Andere Beschäftigte benötigen keinen pauschalen Zugriff auf alle Aufträge.',
    question:
      'Welche Prozessänderung verhindert den beschriebenen Informationsengpass am gezieltesten?',
    options: [
      'Alle persönlichen Merklisten an sämtliche Beschäftigten senden, damit immer jemand den aktuellen Stand kennt.',
      'Nur eine zweite Telefonnummer der Disponentin hinterlegen und die übrige Dokumentation unverändert lassen.',
      'Die geforderten Auftragsstände verbindlich im freigegebenen Ordner pflegen und den Vertretungszugriff erproben.',
      'Den Auftragsordner um den Namen der Vertretung ergänzen; weitere Angaben bleiben in der persönlichen Merkliste.',
    ],
    correctIndex: 2,
    explanation:
      'Im Fall fehlt ein nachvollziehbarer Auftragsstand am vorgesehenen gemeinsamen Ort. Die gezielte Verbesserung besteht darin, genau diese Informationen dort laufend zu pflegen und zu prüfen, ob die berechtigte Vertretung sie tatsächlich nutzen kann. Eine weitere Telefonnummer schafft keine unabhängige Vertretungsfähigkeit. Ein Vertretungsname allein enthält die fehlenden Stände nicht. Eine pauschale Verteilung sämtlicher Merklisten überschreitet den ausdrücklich begrenzten Zugriff und beseitigt keine verbindliche Pflegeverantwortung. Bewertet wird der gegebene Betriebsablauf, keine allgemeine Pflicht zur Nutzung eines bestimmten Systems.',
    hint: 'Welche Informationen braucht die Vertretung wirklich, wo sollen sie vorliegen und wie lässt sich die Nutzbarkeit dieses Wegs prüfen?',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
];
