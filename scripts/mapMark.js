ymaps.ready(init);
var myMap;
var countRow = 0;
var table;
var geoData = [];
var activeMode = "point"; // По умолчанию режим "точка"

var currentPolygon = null;

var polyCoords = [];


function init() {
    myMap = new ymaps.Map("map", {
        center: [57.5262, 38.3061], // Углич
        zoom: 11
    }, {
        balloonMaxWidth: 200,
        searchControlProvider: 'yandex#search'
    });

    table = document.createElement("table");
    table.classList.add("table", "table-striped", "table-bordered", "table-hover");
    document.body.appendChild(table);

    // Добавляем событие клика на карту
    myMap.events.add('click', function (e) {
        const coords = e.get('coords');
        if (activeMode === "point") {
            addPoint(coords);
        } else if (activeMode === "line") {
            addLine(coords);
        } else if (activeMode === "poly") {
            addPolygonPoint(coords);
        }
    });

    document.getElementById("button_point").addEventListener("click", () => {
        document.getElementById("button_new_poly").classList.add("d-none");
        activeMode = "point";
        savePolygonCoords();
    });

    document.getElementById("button_line").addEventListener("click", () => {
        document.getElementById("button_new_poly").classList.add("d-none");
        activeMode = "line";
        savePolygonCoords();
    });

    document.getElementById("button_poly").addEventListener("click", () => {
        document.getElementById("button_new_poly").classList.remove("d-none");
        activeMode = "poly";
        polyCoords = [];
    });

    document.getElementById("button_save").addEventListener("click", saveToFile);
    document.getElementById("button_load").addEventListener("click", loadFromFile);
    document.getElementById("button_new_poly").addEventListener("click", () => {
        savePolygonCoords();
        polyCoords = [];
    });
}

function addPoint(coords) {
    countRow++;
    var myGeoObject = new ymaps.GeoObject({
        geometry: {
            type: "Point",
            coordinates: coords
        },
        properties: {
            iconContent: countRow,
            hintContent: `${coords[0].toPrecision(8)}, ${coords[1].toPrecision(8)}`
        }
    }, {
        preset: 'islands#blackStretchyIcon',
        draggable: true
    });

    myMap.geoObjects.add(myGeoObject);

    let row = table.insertRow();
    let cell1 = row.insertCell();
    let cell2 = row.insertCell();
    let cell3 = row.insertCell();

    cell1.innerHTML = countRow + " Point";
    cell2.innerHTML = coords[0].toPrecision(8);
    cell3.innerHTML = coords[1].toPrecision(8);

    geoData.push({
        type: "Point",
        row: countRow,
        coordinates: coords
    });
}

let lineStartCoords = null;

function addLine(coords) {
    
    if (!lineStartCoords) {
        countRow++;
        lineStartCoords = coords;
        let rowS = table.insertRow();
        let cellS = rowS.insertCell();
    
        cellS.innerHTML = countRow + " Line";

        let row = table.insertRow();
        let cell2 = row.insertCell();
        let cell3 = row.insertCell();
    
        cell2.innerHTML = coords[0].toPrecision(8);
        cell3.innerHTML = coords[1].toPrecision(8);
    } else {
        const line = new ymaps.Polyline([lineStartCoords, coords], {}, { strokeColor: "#0000FF", strokeWidth: 4 });
        myMap.geoObjects.add(line);

        let row = table.insertRow();
        let cell2 = row.insertCell();
        let cell3 = row.insertCell();
    
        cell2.innerHTML = coords[0].toPrecision(8);
        cell3.innerHTML = coords[1].toPrecision(8);       

        geoData.push({
            type: "Line",
            coordinates: [lineStartCoords, coords]
        });

        lineStartCoords = null;
    }
}

function addPolygonPoint(coords) {
    if (polyCoords.length === 0) {
        // Инициализация полигона
        countRow++;
        polyCoords.push(coords); // Добавляем первую точку

        // Создаём полигон
        currentPolygon = new ymaps.Polygon([polyCoords], {}, {
            strokeColor: "#0000FF",
            strokeWidth: 4
        });

        // Добавляем полигон на карту
        myMap.geoObjects.add(currentPolygon);

        // Добавляем строку в таблицу
        let rowS = table.insertRow();
        let cellS = rowS.insertCell();
        cellS.innerHTML = countRow + " Poly";

        // Добавляем координаты первой точки в таблицу
        addCoordsToTable(coords);
    } else {
        // Добавляем новую точку в массив координат
        polyCoords.push(coords);

        // Обновляем координаты полигона
        currentPolygon.geometry.setCoordinates([polyCoords]);

        // Добавляем координаты новой точки в таблицу
        addCoordsToTable(coords);
    }

}

function savePolygonCoords(){
    if (polyCoords.length > 0) {
        geoData.push({
            type: "Polygon",
            row: countRow,
            coordinates: polyCoords
        });
    }
    polyCoords = [];
}

// Вспомогательная функция для добавления координат в таблицу
function addCoordsToTable(coords) {
    let row = table.insertRow();
    let cell2 = row.insertCell();
    let cell3 = row.insertCell();
    cell2.innerHTML = coords[0].toPrecision(8);
    cell3.innerHTML = coords[1].toPrecision(8);
}

// Сохранение данных в формате GeoJSON
function saveToFile() {
    savePolygonCoords();
    const geoJson = {
        type: "FeatureCollection",
        features: geoData.map((item) => {
            if (item.type === "Point") {
                return {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: item.coordinates
                    },
                    properties: {
                        row: item.row
                    }
                };
            } else if (item.type === "Line") {
                return {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: item.coordinates
                    },
                    properties: {
                        row: item.row
                    }
                };
            } else if (item.type === "Polygon") {
                return {
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        coordinates: [item.coordinates]
                    },
                    properties: {
                        row: item.row
                    }
                };
            }
        })
    };

    const blob = new Blob([JSON.stringify(geoJson, null, 4)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Создаём скрытую ссылку для загрузки файла
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map_data.geojson'; // Имя файла
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Загрузка данных из файла GeoJSON
function loadFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.geojson,.json'; // Принимаем GeoJSON или JSON

    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const geoJson = JSON.parse(e.target.result);
                    if (geoJson.type === "FeatureCollection" && Array.isArray(geoJson.features)) {
                        loadGeoDataFromGeoJSON(geoJson);
                    } else {
                        throw new Error("Некорректный GeoJSON");
                    }
                } catch (error) {
                    alert("Ошибка чтения файла. Убедитесь, что это правильный GeoJSON.");
                }
            };
            reader.readAsText(file);
        }
    };

    input.click(); // Открываем диалог выбора файла
}

// Загрузка объектов на карту из GeoJSON
function loadGeoDataFromGeoJSON(geoJson) {
    myMap.geoObjects.removeAll(); // Удаляем текущие объекты
    table.innerHTML = ""; // Очищаем таблицу
    geoData = []; // Очищаем массив данных
    countRow = 0; // Сбрасываем счётчик строк

    geoJson.features.forEach((feature) => {
        const { type, coordinates } = feature.geometry;
        const { row } = feature.properties || {};

        if (type === "Point") {
            addPoint(coordinates);
        } else if (type === "LineString") {
            coordinates.forEach((coord, index) => {
                if (index === 0) {
                    addLine(coord);
                } else {
                    addLine(coord);
                }
            });
        } else if (type === "Polygon") {
            coordinates[0].forEach((coord) => {
                addPolygonPoint(coord);
            });
            currentPolygon = null;
            polyCoords = [];
        }
    });
}
