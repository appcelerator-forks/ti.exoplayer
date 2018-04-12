//  Add the module as a dependency to your application by adding a `<module>`
//  item to the `<modules>` element of your `tiapp.xml` file:
//    <ti:app>
//      ...
//      <modules>
//        <module platform="android">ru.netris.mobile.exoplayer</module>
//      </modules>
//      ...
//    </ti:app>

var ExoPlayer = require('ru.netris.mobile.exoplayer');
var exolist = 'https://raw.githubusercontent.com/google/ExoPlayer/r2.5.4/' +
  'demo/src/main/assets/media.exolist.json';

var OPTIONS = {
  'Use Ti.Media.VideoPlayer': true,
  fullscreen: false,
  autoplay: true,
  repeatMode: false,
  showsControls: true
};

/**
 * @param {{
 *   drmScheme: string,
 *   drmLicenseUrl: string,
 *   drmKeyRequestProperties: string,
 *   adTagUri: string,
 *   contentType: number
 *   default: boolean,
 *   fullscreen: boolean,
 *   autoplay: boolean,
 *   showsControls: boolean,
 *   repeatMode: number,
 *   ur: string
 * }} options
 */
function play(options) {
  var vidWin;
  var player;
  var opts = {};

  Object.keys(options).forEach(function(key) {
    opts[key] = options[key];
  });
  if (!options.fullscreen) {
    vidWin = Ti.UI.createWindow({
      title: options['name'] || 'Video View Demo',
      backgroundColor: '#fff'
    });
    opts['height'] = 300;
    opts['width'] = 300;
    opts['top'] = 10;
  }
  console.log('Create player with ' + JSON.stringify(opts));
  if (options.default) {
    player = Ti.Media.createVideoPlayer(opts);
  } else {
    player = ExoPlayer.createVideoPlayer(opts);
  }

  var PlayerEvents = [
    'click',
    'complete',
    'durationavailable',
    'error',
    'load',
    'loadstate',
    'playbackstate',
    'playing',
    'postlayout',
    'preload'
  ];

  PlayerEvents.forEach(function(event) {
    player.addEventListener(event, function(e) {
      console.log('PLAYER EVENT ' + event);
      try {
        var a = JSON.parse(JSON.stringify(e));
        delete a.source;
        console.log(a);
      } catch (e) {}
    });
  });

  if (vidWin) {
    vidWin.add(player);
    vidWin.open();
  }
}


function convertProperty(key, value) {
  switch (key) {
  case 'uri':
    return {key: 'url', value: value};
  case 'drm_scheme':
    return {key: 'drmScheme', value: value};
  case 'drm_license_url':
    return {key: 'drmLicenseUrl', value: value};
  case 'drm_key_request_properties':
    return {key: 'drmKeyRequestProperties', value: value};
  case 'ad_tag_uri':
    return {key: 'adTagUri', value: value};
  case 'extension':
    key = 'contentType';
    switch (value) {
    case 'mpd':
      value = ExoPlayer.CONTENT_TYPE_DASH;
      break;
    case 'm3u8':
      value = ExoPlayer.CONTENT_TYPE_HLS;
      break;
    case 'ism':
    case 'isml':
    case 'ism/manifest':
    case 'isml/manifest':
      value = ExoPlayer.CONTENT_TYPE_SS;
      break;
    default:
      value = ExoPlayer.CONTENT_TYPE_OTHER;
    }
    return {key: key, value: value};
  default:
    return {key: key, value: value};
  }
}

function loadList() {
  var xhr = Ti.Network.createHTTPClient({
    onload: function() {
      indicator.hide();
      createViews(JSON.parse(this.responseText));
    },
    onerror: function(e) {
      indicator.hide();
      var notification = Ti.UI.createNotification({
        message: e.code + ' ' + e.error,
        duration: Ti.UI.NOTIFICATION_DURATION_LONG
      });
      notification.show();
      console.error(e.code);
      console.error(e.error);
    }
  });

  xhr.open('GET', exolist);
  xhr.send();
}

function createViews(json) {
  var table = createTable(json);
  var view = Ti.UI.createView({
    layout: 'vertical',
    height: Ti.UI.FILL,
    width: Ti.UI.FILL
  });
  Object.keys(OPTIONS).forEach(function(name) {
    createSwitch(name, view);
  });
  view.add(table);
  win.add(view);
}

function createTable(json) {
  var data = [];
  json.forEach(function(o) {
    var section = Ti.UI.createTableViewSection({ headerTitle: o['name'] });
    o['samples'].forEach(function(row) {
      section.add(Ti.UI.createTableViewRow({
        color: '#000',
        title: row['name'],
        data: row
      }));
    });
    data.push(section);
  });

  var table = Ti.UI.createTableView({data: data});
  table.addEventListener('click', function click(e) {
    if (e && e['source'] && e['source']['data'] && e['source']['data']['uri']) {
      var options = e['source']['data'];
      var opts = {
        default: OPTIONS['Use Ti.Media.VideoPlayer'],
        fullscreen: OPTIONS.fullscreen,
        autoplay: OPTIONS.autoplay,
        repeatMode: OPTIONS.repeatMode ?
          Ti.Media.VIDEO_REPEAT_MODE_ONE : Ti.Media.VIDEO_REPEAT_MODE_NONE,
        showsControls: OPTIONS.showsControls
      };
      Object.keys(options).forEach(function(key) {
        var temp = convertProperty(key, options[key]);
        opts[temp.key] = temp.value;
      });
      play(opts);
    }
  });
  return table;
}

function createSwitch(name, parent) {
  var line = Ti.UI.createView({
    backgroundColor: '#eee',
    height: Ti.UI.SIZE,
    width: Ti.UI.FILL
  });
  var basicSwitch = Ti.UI.createSwitch({
    right: 10,
    value: OPTIONS[name]
  });

  basicSwitch.addEventListener('change', function(e) {
    OPTIONS[name] = e.value;
    label1.color = OPTIONS[name] ? '#900' : '#666';
  });
  var label1 = Ti.UI.createLabel({
    color: OPTIONS[name] ? '#900' : '#666',
    text: name,
    textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
    left: 10,
    width: Ti.UI.SIZE,
    height: Ti.UI.SIZE
  });

  line.add(label1);
  line.add(basicSwitch);
  parent.add(line);
}

var win = Ti.UI.createWindow({
  title: 'Ti ExoPlayer Demo',
  backgroundColor: '#fff'
});

var indicator = Ti.UI.createActivityIndicator({
  center: {x: '50%', y: '50%'}
});
win.add(indicator);
win.addEventListener('open', function(e) {
  indicator.show();
  loadList();
});

win.open();
