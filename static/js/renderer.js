const $ = import('jquery');
const ctx = document.getElementById('httpchart').getContext('2d');

function getLatestData( counter ) {
  const now = Date.now();
  let data = [];
  switch (counter) {
    case "200":
        data = [
            { x: now, y: Math.random() * 500 }, // HTTP 200
        ];
      break;
    case "403":
        data = [
            { x: now, y: Math.random() * 0 }, // HTTP 403
        ];
      break;
    case "404":
        data = [
            { x: now, y: Math.random() * 160 }, // HTTP 404
        ];
      break;
    case "4xx":
        data = [
            { x: now, y: Math.random() * 10 }, // HTTP 4xx
        ];
      break;
    case "5xx":
        data = [
            { x: now, y: Math.random() * 10 }, // HTTP 5xx  
        ];
      break;
    default:
        data = [
            { x: now, y: 0 }, // ??
        ];
      break;
  }

  return data;
}


const httpChart = new Chart(ctx, {
  type: 'line',             // 'line', 'bar', 'bubble' and 'scatter' types are supported
  data: {
    datasets: [{
            label: "HTTP 200",
            borderColor: "white",
            backgroundColor: "#ffffff20",
            fill: true
        },{
            label: "HTTP 403",
            borderColor: "red",
            backgroundColor: "#ffffff20",
            fill: true
        },{
            label: "HTTP 404",
            borderColor: "yellow",
            backgroundColor: "#ffffff20",
            fill: true
        },{
            label: "HTTP 4xx",
            borderColor: "#FFC300",
            backgroundColor: "#ffffff20",
            fill: true
        },{
            label: "HTTP 5xx",
            borderColor: "blue",
            backgroundColor: "#ffffff20",
            fill: true
        }]
  },
  options: {
    borderWidth: 2,
        tension: 0.3,
        responsive: true,
        maintainAspectRatio: false,
        elements: {
            point:{
                radius: 0
            }
        },
        plugins: {
           legend: {
                display: true,
                position: "right",
                labels: {
                    boxWidth: 6,
                    boxHeight: 6
                }
            }
        },
    scales: {
      x: {
        type: 'realtime',   // x axis will auto-scroll from right to left
        realtime: {         // per-axis options
          duration: 30000,  // data in the past 20000 ms will be displayed
          refresh: 1000,    // onRefresh callback will be called every 1000 ms
          delay: 1000,      // delay of 1000 ms, so upcoming values are known before plotting a line
          pause: false,     // chart is not paused
          ttl: undefined,   // data will be automatically deleted as it disappears off the chart
          frameRate: 30,    // data points are drawn 30 times every second

          onRefresh: chart => {
            var line1 = getLatestData("200"); // HTTP 200
            var line2 = getLatestData("403"); // HTTP 403
            var line3 = getLatestData("404"); // HTTP 404
            var line4 = getLatestData("4xx"); // HTTP 4xx
            var line5 = getLatestData("5xx"); // HTTP 5xx
            chart.data.datasets[0].data.push(...line1);
            chart.data.datasets[1].data.push(...line2);
            chart.data.datasets[2].data.push(...line3);
            chart.data.datasets[3].data.push(...line4);
            chart.data.datasets[4].data.push(...line5);
          }
        
        }
      }
    }
  }
});
