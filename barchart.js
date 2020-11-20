var chart = AmCharts.makeChart("chartdiv", {
  "type": "serial",
  "addClassNames": true,
  "dataProvider": [{
    "country": "IRAQ",
    "GDP_real_growth": 52.3,
    "GDP_per_capita": 3500,
    "GDP_actual" : 89800
  }, {
    "country": "CHAD",
    "GDP_real_growth": 38,
    "GDP_per_capita": 1600,
    "GDP_actual" : 15660
  }, {
    "country": "LIBERIA",
    "GDP_real_growth": 21.8,
    "GDP_per_capita": 900,
    "GDP_actual" : 2903
  }, {
    "country": "EQUATORIAL",
    "GDP_real_growth": 20,
    "GDP_per_capita": 2700,
    "GDP_actual" : 1270
  }, {
    "country": "VENEZUELA",
    "GDP_real_growth": 16.8,
    "GDP_per_capita": 5800,
    "GDP_actual" : 145200
  }, {
    "country": "MACAU",
    "GDP_real_growth": 15.6,
    "GDP_per_capita": 19400,
    "GDP_actual" : 9100
  }, {
    "country": "UKRAINE",
    "GDP_real_growth": 12,
    "GDP_per_capita": 6300,
    "GDP_actual" : 299100
  }, {
    "country": "ANGOLA",
    "GDP_real_growth": 11.7,
    "GDP_per_capita": 2100,
    "GDP_actual" : 23170
  }, {
    "country": "ETHIOPIA",
    "GDP_real_growth": 11.6,
    "GDP_per_capita": 800,
    "GDP_actual" : 54890
  },{
    "country": "LIECHTENST",
    "GDP_real_growth": 11,
    "GDP_per_capita": 25000,
    "GDP_actual" : 825
  }
],
  "valueAxes": [{
    "stackType": "3d",
    "id": "v1",
    "unit": "",
    "position": "left",
    "title": "GDP growth real (M) Green Bars",
  }],
  "startDuration": 0,
  "graphs": [{
    "id": "g1",
    "balloonText": "GDP grow in [[category]] (GDP_real_growth): <b>[[value]]%</b>",
    "fillAlphas": 0.9,
    "lineAlpha": 0.2,
    "title": "2004",
    "type": "column",
    "valueField": "GDP_real_growth"
  }, {
    "id": "g2",
    "balloonText": "GDP grow in [[category]] (GDP_per_capita): <b>[[value]]</b>",
    "fillAlphas": 0.9,
    "lineAlpha": 0.2,
    "title": "2005",
    "type": "column",
    "valueField": "GDP_per_capita"
      },

      {
        "id": "g3",
        "balloonText": "GDP grow in [[category]] (GDP Actual): <b>[[value]]M</b>",
        "fillAlphas": 0.9,
        "lineAlpha": 0.2,
        "title": "2005",
        "type": "column",
        "valueField": "GDP_actual"
          },
          
    ],

  "plotAreaFillAlphas": 0.1,
  "depth3D": 60,
  "angle": 30,
  "categoryField": "country",
  "categoryAxis": {
    "gridPosition": "start"
  }
});