const source = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv';

const countries = ['Sweden', 'Belarus', 'Finland', 'Denmark', 'Norway', 'Ireland', 'Greece', 'Slovakia', 'Japan', 'Estonia',  'Germany',  'New Zealand'];

const populations = { // 10s of millions with 2 digits precision
    Sweden: 1.0,
    Norway: 0.54,
    Finland: 0.55,
    Ireland: 0.49,
    Denmark: 0.58,
    Estonia: 0.13,
    Germany: 8.3,
    Slovakia: 0.55,
    Japan: 13,
    Greece: 1.1,
    Belarus: 0.95,
    'New Zealand': 0.49
};

window.onload = load;

let timeout = null;
window.onresize = () => {
    if (timeout) clearTimeout(timeout);
    timeout = window.setTimeout(load, 500);
};

function load() {
    timeout = null;
    if (getState() === null) {
        updateState();
    } else {
        run();
    }
}

document.getElementById('btnUpdateState').onclick = updateState;

function updateState(cb) {
    console.log('updateState()');
    fetch(source)
        .then(res => res.text())
        .then(parseCsv)
        .then(sort)
        .then(rollingThirteenDaysAverages)
        .then(setState)
        .then(() => run(true));
}

function rollingThirteenDaysAverages(inputCountries) {
    const outputCountries = [];

    inputCountries.forEach(inputCountry => {
        const outputCountry = {};

        outputCountry.country = inputCountry.country;

        outputCountry.serie = [];

        for (var i = 0; i < inputCountry.serie.length; i++) {
            if (i < 6) {
                outputCountry.serie[i] = inputCountry.serie[i];
            } else if (i < inputCountry.serie.length - 6) {
                var thirteenDaySum =
                    parseInt(inputCountry.serie[i - 6]) +
                    parseInt(inputCountry.serie[i - 5]) +
                    parseInt(inputCountry.serie[i - 4]) +
                    parseInt(inputCountry.serie[i - 3]) +
                    parseInt(inputCountry.serie[i - 2]) +
                    parseInt(inputCountry.serie[i - 1]) +
                    parseInt(inputCountry.serie[i]) +
                    parseInt(inputCountry.serie[i + 1]) +
                    parseInt(inputCountry.serie[i + 2]) +
                    parseInt(inputCountry.serie[i + 3]) +
                    parseInt(inputCountry.serie[i + 4]) +
                    parseInt(inputCountry.serie[i + 5]) +
                    parseInt(inputCountry.serie[i + 6]);
                outputCountry.serie[i] = thirteenDaySum / 13;
            } else if (i < inputCountry.serie.length - 5) {
                var elevenDaySum =
                    parseInt(inputCountry.serie[i - 5]) +
                    parseInt(inputCountry.serie[i - 4]) +
                    parseInt(inputCountry.serie[i - 3]) +
                    parseInt(inputCountry.serie[i - 2]) +
                    parseInt(inputCountry.serie[i - 1]) +
                    parseInt(inputCountry.serie[i]) +
                    parseInt(inputCountry.serie[i + 1]) +
                    parseInt(inputCountry.serie[i + 2]) +
                    parseInt(inputCountry.serie[i + 3]) +
                    parseInt(inputCountry.serie[i + 4]) +
                    parseInt(inputCountry.serie[i + 5]);
                outputCountry.serie[i] = elevenDaySum / 11;
            } else if (i < inputCountry.serie.length - 4) {
                var nineDaySum =
                    parseInt(inputCountry.serie[i - 4]) +
                    parseInt(inputCountry.serie[i - 3]) +
                    parseInt(inputCountry.serie[i - 2]) +
                    parseInt(inputCountry.serie[i - 1]) +
                    parseInt(inputCountry.serie[i]) +
                    parseInt(inputCountry.serie[i + 1]) +
                    parseInt(inputCountry.serie[i + 2]) +
                    parseInt(inputCountry.serie[i + 3]) +
                    parseInt(inputCountry.serie[i + 4]);
                outputCountry.serie[i] = nineDaySum / 9;
            } else if (i < inputCountry.serie.length - 3) {
                var sevenDaySum =
                    parseInt(inputCountry.serie[i - 3]) +
                    parseInt(inputCountry.serie[i - 2]) +
                    parseInt(inputCountry.serie[i - 1]) +
                    parseInt(inputCountry.serie[i]) +
                    parseInt(inputCountry.serie[i + 1]) +
                    parseInt(inputCountry.serie[i + 2]) +
                    parseInt(inputCountry.serie[i + 3]);
                outputCountry.serie[i] = sevenDaySum / 7;
            } else if (i < inputCountry.serie.length - 2) {
                var fiveDaySum =
                    parseInt(inputCountry.serie[i - 2]) +
                    parseInt(inputCountry.serie[i - 1]) +
                    parseInt(inputCountry.serie[i]) +
                    parseInt(inputCountry.serie[i + 1]) +
                    parseInt(inputCountry.serie[i + 2]);
                outputCountry.serie[i] = fiveDaySum / 5;
            } else if (i < inputCountry.serie.length - 1) {
                var threeDaySum =
                    parseInt(inputCountry.serie[i - 1]) +
                    parseInt(inputCountry.serie[i]) +
                    parseInt(inputCountry.serie[i + 1]);
                outputCountry.serie[i] = threeDaySum / 3;
            } else {
                // Skip tail edge
                // outputCountry.serie[i] = inputCountry.serie[i];
            }
        }

        outputCountries.push(outputCountry);
    });

    return outputCountries;
}

let chartWidthScale = 6;
let cachedClientWidth = 0;

function run(force = false) {
    if (!force && cachedClientWidth === document.documentElement.clientWidth) {
        return;
    }

    cachedClientWidth = document.documentElement.clientWidth;
    console.log('cachedClientWidth: ' + cachedClientWidth);

    if (document.documentElement.clientWidth > 768) {
        chartWidthScale = document.documentElement.clientWidth / 1300;
    } else if (document.documentElement.clientWidth < 667) {
        chartWidthScale = document.documentElement.clientWidth / 400;
    } else {
        chartWidthScale = document.documentElement.clientWidth / 800;
    }

    const state = getState();

    const countryBarChartsContainer = document.getElementById('countryBarCharts');
    countryBarChartsContainer.innerHTML = '';

    state.forEach(item => {
        createCountryBarChart(item, countryBarChartsContainer);
    });
}

function createCountryBarChart(country, container) {
    let countryElement = document.createElement('div');
    countryElement.className = 'country-bar-chart';
    container.appendChild(countryElement);

    let chartElement = document.createElement('div');
    chartElement.className = 'country-bar-chart__chart';
    let chartElementId = 'countryBarChart-' + country.country.split(' ').join('_');
    chartElement.id = chartElementId;
    countryElement.appendChild(chartElement);

    const deathsPerDayArr = deathsPerDay(country.serie);
    let foo = populations[country.country];
    const normalizedDeathsPerDayArr = deathsPerDayArr.map(x => Math.floor(x / populations[country.country]));
    const pixelWidth = Math.floor(65 + chartWidthScale * deathsPerDayArr.length);

    chartElement.style.width = `${pixelWidth}px`;

    let data = {
        labels: createLabels(normalizedDeathsPerDayArr),
        series: [normalizedDeathsPerDayArr]
    };

    let options = {
        high: 120,
        low: 0,
        lineSmooth: true,
        showGridBackground: false,
        showArea: true,
        axisX: {
            labelOffset: {
                x: -4,
                y: 0
            },
            showGrid: false,
            labelInterpolationFnc: function (value, index) {
                // return index % 10 === 0 ? index : null;
                return value % 50 === 0 ? value : null;
            }
        },
        axisY: {
            labelOffset: {
                x: 0,
                y: 5
            },
            labelInterpolationFnc: function (value) {
                return value % 25 === 0 ? value : null;
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
        labels.push(i + 1);
    }
    return labels;
}

function sort(data) {
    const sorted = [];
    countries.forEach(country => {
        sorted.push(data.find(item => item.country === country));
    })
    return sorted;
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
