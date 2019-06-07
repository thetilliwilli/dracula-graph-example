1. два файла содержащие библиотеку переименовать:

    1.1. rephael.min.js -> 01_rephael.min.js

    1.2. dracula.min.js -> 02_dracula.min.js

2. подложить в VIP-Dashboards\Sources\PL\Viewer\Visiology.VA.PL.DashboardViewer\wwwroot\custom

3. код виджета из файла main.js скопировать и вставить в https://babeljs.io/repl/ затем транспилировать в es2015 (если нужна поддержка в старых браузерах типа IE)

4. Транспилированный код вставить в CodeEditor кастомного виджета

4. в кастомном виджете доступны следующие настройки

```
{
    "lineWidth": 8, //толщина соеденительных линий
    "fixedLayout": true, //зафиксировать позиции нодов чтобы не скакали
}
```