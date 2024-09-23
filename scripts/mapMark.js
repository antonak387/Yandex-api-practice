ymaps.ready(init);
var myMap;
var countRow = 0;
var table;
var geoData = [];

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
        countRow = countRow + 1;
        var coords = e.get('coords');
        
        var myGeoObject = new ymaps.GeoObject({
            geometry: {
                type: "Point",
                coordinates: [coords[0], coords[1]]
            },
            properties: {
                iconContent: countRow,
                hintContent: 'Ну давай уже тащи'
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

        cell1.innerHTML = countRow;
        cell2.innerHTML = coords[0].toPrecision(6);
        cell3.innerHTML = coords[1].toPrecision(6);

        // Сохраняем данные для дальнейшей загрузки
        geoData.push({
            row: countRow,
            coordinates: coords
        });
    });

    // Сохраняем данные в localStorage при нажатии на кнопку SAVE
    document.getElementById("button_save").addEventListener("click", function() {
        saveData();
    });

    // Загружаем данные из localStorage при нажатии на кнопку LOAD
    document.getElementById("button_load").addEventListener("click", function() {
        loadData();
    });
}

function saveData() {
    // Сохраняем данные geoData и таблицы в localStorage
    localStorage.setItem("geoData", JSON.stringify(geoData));
    alert("Данные успешно сохранены!");
}

function loadData() {
    // Загружаем данные из localStorage
    const savedGeoData = JSON.parse(localStorage.getItem("geoData"));
    if (savedGeoData) {
        clearTableAndMap();  // Очищаем карту и таблицу перед загрузкой

        savedGeoData.forEach(item => {
            countRow = item.row;

            // Восстанавливаем таблицу
            let row = table.insertRow();
            let cell1 = row.insertCell();
            let cell2 = row.insertCell();
            let cell3 = row.insertCell();

            cell1.innerHTML = item.row;
            cell2.innerHTML = item.coordinates[0].toPrecision(6);
            cell3.innerHTML = item.coordinates[1].toPrecision(6);

            // Восстанавливаем метки на карте
            var myGeoObject = new ymaps.GeoObject({
                geometry: {
                    type: "Point",
                    coordinates: item.coordinates
                },
                properties: {
                    iconContent: item.row,
                    hintContent: 'Ну давай уже тащи'
                }
            }, {
                preset: 'islands#blackStretchyIcon',
                draggable: true
            });

            myMap.geoObjects.add(myGeoObject);
        });
        alert("Данные успешно загружены!");
    } else {
        alert("Нет сохраненных данных.");
    }
}

function clearTableAndMap() {
    // Очищаем таблицу
    while (table.rows.length > 0) {
        table.deleteRow(0);
    }
    // Очищаем карту
    myMap.geoObjects.removeAll();
}