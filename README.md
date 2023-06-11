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