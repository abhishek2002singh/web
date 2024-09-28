let chartData = JSON.parse(localStorage.getItem('chartData')) || {};
let selectedSymbol = 'ethusdt';
let interval = '1m';
let socket;
let chart;

const ctx = document.getElementById('chart').getContext('2d');

// Initialize the chart with an empty dataset
function initializeChart() {
  chart = new Chart(ctx, {
    type: 'candlestick',
    data: {
      datasets: [{
        label: 'Candlestick Data',
        data: chartData[selectedSymbol] || [],
        borderColor: 'rgba(0, 150, 136, 1)',
        backgroundColor: 'rgba(0, 150, 136, 0.5)',
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'minute'
          }
        },
        y: {
          beginAtZero: false
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

initializeChart();

function switchCoin(symbol) {
  selectedSymbol = symbol;
  updateChart();
  connectWebSocket();
}

function switchTimeInterval(newInterval) {
  interval = newInterval;
  connectWebSocket();
}

function connectWebSocket() {
  if (socket) {
    socket.close();
  }

  const wsUrl = `wss://stream.binance.com:9443/ws/${selectedSymbol}@kline_${interval}`;
  socket = new WebSocket(wsUrl);

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.k && message.k.x) { // Ensure the kline is closed (x = true)
      const data = parseKlineData(message.k);
      storeChartData(data);
      updateChart();
    }
  };
}

function parseKlineData(kline) {
  return {
    x: kline.t, // Time in milliseconds (x-axis)
    o: parseFloat(kline.o), // Open price
    h: parseFloat(kline.h), // High price
    l: parseFloat(kline.l), // Low price
    c: parseFloat(kline.c)  // Close price
  };
}

function storeChartData(data) {
  if (!chartData[selectedSymbol]) {
    chartData[selectedSymbol] = [];
  }

  // Update existing data if timestamp matches, otherwise add new data
  const existingIndex = chartData[selectedSymbol].findIndex(item => item.x === data.x);
  if (existingIndex !== -1) {
    chartData[selectedSymbol][existingIndex] = data;
  } else {
    chartData[selectedSymbol].push(data);
    if (chartData[selectedSymbol].length > 100) {
      chartData[selectedSymbol].shift(); // Limit to the last 100 data points
    }
  }

  localStorage.setItem('chartData', JSON.stringify(chartData));
}

function updateChart() {
  const dataset = chart.data.datasets[0];
  dataset.data = chartData[selectedSymbol] || [];
  chart.update();
}

document.getElementById('cryptoSelect').addEventListener('change', (event) => {
  switchCoin(event.target.value);
});

document.getElementById('timeInterval').addEventListener('change', (event) => {
  switchTimeInterval(event.target.value);
});

// Initial connection
connectWebSocket();
