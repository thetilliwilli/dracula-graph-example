//
//два файла содержащие саму библиотеку (01_rephael.min.js, 02_dracula.min.js) необходимо положить в VIP-Dashboards\Sources\PL\Viewer\Visiology.VA.PL.DashboardViewer\wwwroot\custom
//

//console.log(w);

var widgetId = w.general.renderTo;
var widgetAnchor = "#" + widgetId;
var $widget = $(widgetAnchor);
var globalColors = w.colors;

var propertiesJson = JSON.parse(visApi().getWidgetByGuid(widgetId).widgetState.propertiesJson);
var globalProperties = {
    lineWidth: propertiesJson.lineWidth || 6,
    fixedLayout: propertiesJson.fixedLayout === true,
};

if (!globalProperties.fixedLayout)
    $widget.removeData("preallocatedRandomValues");

var preallocatedRandomValues = $widget.data("preallocatedRandomValues")
    || Array.apply(null, { length: 100 }).map(_ => Math.random());

$widget.data("preallocatedRandomValues", preallocatedRandomValues);

function* randomGenerator() {
    var i = 0;
    while (1) yield preallocatedRandomValues[i++ % preallocatedRandomValues.length];
};

function guerillaPatchForRandom(func) {
    var randomOriginal = Math.random;
    var randomIterator = randomGenerator();
    Math.random = () => randomIterator.next().value;
    func();
    Math.random = randomOriginal;
}

function convertToGraph(data, vertices, adjacencyList) {

    var sourceVerticesInfo = data.cols
        .map(x => x.slice(1)) //удаляем строку с названием показателя
        .map(vertexInfo => ({ label: vertexInfo[0], weight: Number(vertexInfo[1]), vertexId: vertexInfo[2], type: vertexInfo[3] }))
        ;

    var targetVerticesInfo = data.rows
        .map(vertexInfo => ({ label: vertexInfo[0], weight: Number(vertexInfo[1]), vertexId: vertexInfo[2], type: vertexInfo[3] }))
        ;

    vertices.push(...sourceVerticesInfo, ...targetVerticesInfo);
    vertices.minWeight = Math.min(...vertices.map(x => x.weight));
    vertices.maxWeight = Math.max(...vertices.map(x => x.weight));
    vertices.count = vertices.length;
    vertices.calcRelativeWeight = (weight) => (weight - vertices.minWeight) / (vertices.maxWeight - vertices.minWeight);

    adjacencyList.minWeight = Number.MAX_VALUE;
    adjacencyList.maxWeight = 0;
    adjacencyList.count = 0;
    adjacencyList.calcRelativeWeight = (weight) => (weight - adjacencyList.minWeight) / (adjacencyList.maxWeight - adjacencyList.minWeight);

    data.values.forEach((row, rowIndex) => row.forEach((edgeWeight, columnIndex) => {

        var sourceVertex = sourceVerticesInfo[rowIndex];
        var targetVertex = targetVerticesInfo[columnIndex];

        if (edgeWeight != null) {
            adjacencyList.push({ sourceVertex, targetVertex, edgeWeight });
            adjacencyList.minWeight = Math.min(adjacencyList.minWeight, edgeWeight);
            adjacencyList.maxWeight = Math.max(adjacencyList.maxWeight, edgeWeight);
            adjacencyList.count++;
        }

    }));

}

var vertices = [];
var adjacencyList = [];
convertToGraph(w.data, vertices, adjacencyList);


function VertexRenderer(r, n) {
    var safeWeight = 1 + n.weight; // 1 - 1.5
    const parsedColor = Raphael.color(globalColors[n.type % globalColors.length]);
    var color = Raphael.rgb(parsedColor.r, parsedColor.g, parsedColor.b);

    var set = r.set();

    var ellipse = r.ellipse(0, 0, 30 * safeWeight, 20 * safeWeight)
        .attr({ fill: color, 'stroke-width': 2, 'fill-opacity': 1 });

    var text = r.text(0, 0, n.label)
        .attr({ 'font-size': `${12 * safeWeight}px`, "user-select": "none" });

    set
        .push(text)
        .push(ellipse)
        ;

    return set;
}

function drawGraph(vertices, adjacencyList) {

    var widgetWidth = $widget.width();
    var widgetHeight = $widget.height();

    $(widgetAnchor).empty();

    var g = new Dracula.Graph();

    vertices.map(vertex => g.addNode(vertex.vertexId, { label: vertex.label, render: VertexRenderer, weight: vertices.calcRelativeWeight(vertex.weight), type: vertex.type }));

    adjacencyList.map(edge => g.addEdge(edge.sourceVertex.vertexId, edge.targetVertex.vertexId, { fill: `darkgrey|${1 + globalProperties.lineWidth * adjacencyList.calcRelativeWeight(edge.edgeWeight)}`, stroke: "darkgrey" }));

    if (globalProperties.fixedLayout) {
        guerillaPatchForRandom(() => {
            var layouter = new Dracula.Layout.Spring(g);
            layouter.layout();
        });
    }
    else {
        var layouter = new Dracula.Layout.Spring(g);
        layouter.layout();
    }

    var draculaRenderer = new Dracula.Renderer.Raphael(widgetAnchor, g, widgetWidth, widgetHeight);
    draculaRenderer.draw();
}

drawGraph(vertices, adjacencyList);

//!!!должно быть последней строчкой!!! - возвращаем инстанс класса WidgetRenderer
({
    //hack для получения ссылки на конструктор класса WidgetRenderer
    //содержит конструктор класса WidgetRenderer
    __proto__: (new TextRender({ general: { renderTo: "" }, text: { text: "" }, style: {} })).__proto__,
    updateDimensions: () => drawGraph(vertices, adjacencyList),
})