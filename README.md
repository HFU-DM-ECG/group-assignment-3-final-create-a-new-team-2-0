[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-24ddc0f5d75046c5622901739e7c5dd533143b0c8e959d652212380cedb1ea36.svg)](https://classroom.github.com/a/E5ATIiJe)
# Group assignment 03 - Final

## Task
Die Aufgabe ist es die Anwendung aus der ersten Aufgabe zu einer AR oder VR Anwendung auf Basis des WebXR Standards weiter zu entwickeln.

## Bewertung

- Präsentation und Anspruch: 30 %

- WebXR (AR/VR) Konzept: 40 %

- Codequalität: 30 %

# ToDo

Um es lokal zu starten wird node benötigt, um dann mit "npm i" three.js aus der package.json zu installieren. Alternativ kann man es online auf der github-page anschauen. (https://hfu-dm-ecg.github.io/group-assignment-1-webxr-create-a-new-team-2-0/).

Es gibt einen AR- und eine VR-Modus, jenachdem welche Hardware erkannt wird (inklusive WebXR Addon). Der AR-Modus wird mit dem Hit-Test-Feature versehen, um per Smartphone Tap (WebXR Klick) Interaktionen einzubinden. Das Hit-Test-Feature erkennt Oberflächen wie Böden und Wände in der realen Welt und platziert da einen Cursor. Die init()-Funktion wird beim Laden aufgerufen und initialisiert die Szene, Kamera, Buttons, Renderer usw. Darin wird auch die addObjects()-Funktion aufgerufen, welche alle benötigten Modelle in die Szene lädt und mit der animateObject()-Funktion passend animiert. Die Modelle beschreiben eine Weltraumszene in der ein 3D-Modell von einem Portal, welches als Fenster in die echte Welt dient, reingeladen wird und in der Luft schwebt. Dieses Portal besitzt in der Mitte eine Three.js CircleGeometry Plane, dessen Material mit "colorWrite=false" nicht gerendert wird und somit auch alles dahinter nicht gerendert wird. Dadurch entsteht die Illusion einer anderen Welt. Das Portal wird mit auf und ab "Schwebe"-Animationen versehen und der Kreis in der Mitte mit einer verzögerten "Schwebe"-Animation, welche Magnetfelder und Anziehungskräfte simulieren sollen. Noch dazu rotiert und skaliert sich das Portal, um einen schönen Effekt zu kreieren. Die restlichen Modelle befinden sich in der internen onSelect()-Funktion, die bei einer Interaktion an der Position platziert werden. Die Modelle werden zufällig ausgewählt und dienen dafür den leeren Weltraum nach Belieben ("sandbox"-artig) mit Sternen, Planeten und Raumschiffen zu füllen. 
Der Loading Manager wurde so bearbeitet, dass alle Elemente erst synchronisiert werden, wenn auch alle Objekte geladen sind.
Es wurde noch ein weiteres Portal eingefügt, welches einen Effekt hat, der simuliert, als würde der Nutzer in die Welt reingezogen werden.
Außerdem wurden Stencils auf das Portal gelegt, die den Blick durch die gegenüberliegende Welt darstellt.
Durch den Raycast wird der Übergang in die andere Welt mit Hilfe von Hitboxen (Intersectionen) vor und nach dem Portal dargestellt. Wird der Übergang von der einen in die andere Welt durchgeführt, switchen die Skyboxen der jeweiligen Welten und auch die Stencils auf dem Portal. 

Wir haben folgende Dinge probiert und dennoch verworfen:
Wir haben fünf Hitboxen für zwei Portale definiert, mussten dies dennoch verwerfen, weil die Hitboxen zu klein waren. Des Weiteren konnten diese Hitboxen auch übersprungen werden. Dadurch könnte der Nutzer in undefinierte Bereiche springen.
Wir haben auch versucht eine seperate Kamera auf das Portal festzusetzen. Dies hat in der Vorschau zwar funktioniert, wurde aber nicht mit in Augmented Reality übernommen, da die zweite Kamera mit der AR-Hauptkamera mitgerendert und synchronisiert wurde und dadurch das Portal in die jeweilige Welt nicht sauber sondern stark verzerrt geladen wurde.
