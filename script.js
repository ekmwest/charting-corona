//const source = '/time_series_covid19_deaths_global.csv';
const source = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv';

const countries = ['Sweden', 'Italy', 'Norway', 'Finland', 'France', 'Germany', 'United Kingdom', 'US', 'Denmark'];

const populations = { // 10s of millions
    Sweden: 1,
    Italy: 6,
    Norway: 0.5,
    Finland: 0.5,
    France: 6.7,
    Germany: 8.3,
    Iran: 8.1,
    'United Kingdom': 6.6,
    US: 33,
    Denmark: 0.56
};

window.onload = load;

document.getElementById('btnUpdateState').onclick = updateState;

function load() {
    console.log('load()');
    if (getState() === null) {
        updateState();
    } else {
        run();
    }
}

function updateState(cb) {
    console.log('updateState()');
    fetch(source)
        .then(res => res.text())
        .then(parseCsv)
        .then(setState)
        .then(run);
}

function run() {
    console.log('run()');

    const state = getState();

    const countryBarChartsContainer = document.getElementById('countryBarCharts');
    countryBarChartsContainer.innerHTML = '';

    const countryBarChartsTitleElement = document.createElement('h2');
    countryBarChartsTitleElement.innerText = 'Deaths / 10 million / Day';
    countryBarChartsContainer.appendChild(countryBarChartsTitleElement);

    const countryBarChartsSubTitleElement = document.createElement('h3');
    countryBarChartsSubTitleElement.innerText = 'Starting at total of 2 dead';
    countryBarChartsContainer.appendChild(countryBarChartsSubTitleElement);

    state.forEach(item => {
        createCountryBarChart(item, countryBarChartsContainer);
    });
}

function createCountryBarChart(country, container) {
    console.log('createCountryBarChart()');

    let countryElement = document.createElement('div');
    countryElement.className = 'country-bar-chart';
    container.appendChild(countryElement);

    let chartElement = document.createElement('div');
    chartElement.className = 'country-bar-chart__chart';
    let chartElementId = 'countryBarChart-' + country.country.split(' ').join('_');
    chartElement.id = chartElementId;
    countryElement.appendChild(chartElement);

    const deathsPerDayArr = deathsPerDay(country.serie);
    const normalizedDeathsPerDayArr = deathsPerDayArr.map(x => Math.floor(x / populations[country.country]));
    const pixelWidth = 65 + 20 * deathsPerDayArr.length;

    chartElement.style.width = `${pixelWidth}px`;

    let data = {
        labels: createLabels(normalizedDeathsPerDayArr),
        series: [normalizedDeathsPerDayArr]
    };

    let options = {
        high: 200,
        lineSmooth: false,
        showGridBackground: true,
        showArea: true,
        axisX: {
            labelOffset: {
                x: -4,
                y: 0
            },
            showGrid: false
        },
        axisY: {
            labelOffset: {
                x: 0,
                y: 5
            }
        }
    };

    new Chartist.Line(`#${chartElementId}`, data, options);

    let countryNameElement = document.createElement('h3');
    countryNameElement.textContent = country.country;
    chartElement.appendChild(countryNameElement);
}

function deathsPerDay(serie) {
    let deathsPerDay = [];

    for (var i = 0; i < serie.length; i++) {
        let sum = parseInt(serie[i]);
        if (sum < 2) continue;
        deathsPerDay.push(sum - parseInt(serie[i - 1]))
    }
    return deathsPerDay;
}

function createLabels(serie) {
    let labels = [];
    for (let i = 0; i < serie.length; i++) {
        labels.push(i+1);
    }
    return labels;
}

function parseCsv(csv) {
    let raw = [];
    let parsed = [];

    csv.trim().split('\n').forEach(line => {
        const rawLine = parseCsvLine(line);
        if (Array.isArray(rawLine) && rawLine.length > 2) {
            raw.push(rawLine);
        }
    });

    for (let i = 1; i < raw.length; i++) {
        if (raw[i][0]) continue; // skip provinces
        if (!countries.includes(raw[i][1])) continue; // only if in countries
        parsed.push({
            country: raw[i][1],
            serie: raw[i].slice(4)
        });
    }
    return parsed;
}

function parseCsvLine(text) {
    // https://stackoverflow.com/questions/8493195/how-can-i-parse-a-csv-string-with-javascript-which-contains-comma-in-data

    var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
    var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;

    // null if invalid format
    if (!re_valid.test(text)) {
        console.warn('Invalid csv line: ' + text);
        return null;
    }

    var a = [];
    text.replace(re_value,
        function (m0, m1, m2, m3) {
            if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
            else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
            else if (m3 !== undefined) a.push(m3);
            return '';
        });

    if (/,\s*$/.test(text)) a.push('');
    return a;
}

function setState(state) {
    localStorage.setItem('state', JSON.stringify(state));
}

function getState() {
    return JSON.parse(localStorage.getItem('state'));
}