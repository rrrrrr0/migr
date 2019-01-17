var mappa = new Mappa('Mapbox', 'pk.eyJ1IjoiZGVsaTAiLCJhIjoiY2pxZnBwdG5oMDJrdTQ5bW9pMXpyZjQxZyJ9.0DX3lf5p6mMYHDkSC8H4EA');
var options = {
  username: 'deli0',
  lat: 38.8,
  lng: 35.2,
  zoom: 5.5,
  width: 1280,
  height: 720,
  scale: 1,
  pitch: 0,
  style: 'cjqfq6to2j2z02rt78s9tlc8i'
}
var tr = mappa.staticMap(options);
var img;
var koord;
migrants = [];
emigrants = [];
immigrants = [];
var index = 1;
var tableSize;
const track = document.getElementById("track");
const trail = document.getElementById("trail");
const filter = document.getElementById("filter");
const play =document.getElementById("play");
const particleLimit = 1000;
var recordPerFrame = 8;
const maxPop = 15000;
var run = true;

function preload(){
  img = createGraphics(width, height);
  img = loadImage(tr.imgUrl);
  koord = loadTable('ilkoord.csv', 'csv', 'header');
  jumpers = loadTable('migr.csv', 'csv', 'header');
}

function setup(){
  createCanvas(1280, 720);
  noStroke();
  noLoop();
  tableSize = jumpers.getRowCount();
  image(img, 0, 0);
  for (var i = 1; i < 82; i++){
    immigrants[i] = 0;
    emigrants[i] = 0;
  }
}
function togglePlay() {
  run = !run;
  if (run) {
    noLoop();
    play.innerHTML = "&#x23f5;";
  }else {
    loop();
    play.innerHTML = "&#x23f8;";
  }
}
function mousePressed(){
  console.log(migrants.length);
  //index = 290000;
}

function draw(){
  var year, orig, dest, origX, origY, destX, destY, popSize, city, idO, idD, pixO, pixD, particleSize;
  image(img, 0, 0);
  textFont('Verdana');
  fill(255, 255, 255, 200);
  textSize(9);
  textAlign(CENTER);
  noStroke();
  //text(migrants.length, 20,20);
  text(jumpers.getString(index-1, 'birth'), 50,50);
  recordPerFrame = map(track.value, 1, 100, 8, 50);
  for (var i=1; i < 82; i++){
    city = koord.matchRow(new RegExp(i), 0);
    origX = city.getNum(2);
    origY = city.getNum(3);
    pixO = tr.latLngToPixel(origX, origY);
    fill(255, 255, 255, 75);
    text(koord.getString(i-1, 'IL'), pixO.x, pixO.y -10);
    text(String.fromCharCode(0x23F5) + numberWithDots(immigrants[i]), pixO.x, pixO.y);
    text(String.fromCharCode(0x23F4) + numberWithDots(emigrants[i]), pixO.x, pixO.y + 10);
  }
  if (migrants.length < particleLimit) {
    for (var x = 0; x < recordPerFrame; x++){
      if (index < tableSize){
        orig = jumpers.getString(index, 'birth_city');
        dest = jumpers.getString(index, 'address_city');
        year = jumpers.getString(index, 'birth');
        popSize = jumpers.getString(index, 'pop');
        city = koord.matchRow(new RegExp('^' + orig + '$'), 1);
        origX = city.getNum(2);
        origY = city.getNum(3);
        idO = city.getNum(0);
        city = koord.matchRow(new RegExp('^' + dest + '$'), 1);
        destX = city.getNum(2);
        destY = city.getNum(3);
        idD = city.getNum(0);
        pixO = tr.latLngToPixel(origX, origY);
        pixD = tr.latLngToPixel(destX, destY);
        migrants.push( new Migrant(dest, orig, pixO.x, pixO.y, pixD.x, pixD.y, popSize, idO, idD));
        emigrants[idO] += +popSize;
        index++;
      }
    }
  }
  for (var i = migrants.length-1; i >= 0 ; i--){
    migrants[i].update();
    if (filter.value != "filtre") {
      if (filter.value == migrants[i].destId || filter.value == migrants[i].origId ) {
        migrants[i].show();
      }
    }else {
      migrants[i].show();
    }
    if (migrants[i].pct >= 0.99){
      immigrants[migrants[i].idD] += +migrants[i].pop;
      migrants.splice(i, 1);
    }
  }
}

function Migrant(destId, origId, originX, originY, destinationX, destinationY, pop, idO, idD ){
  this.origId = origId;
  this.destId = destId;
  this.x0 = originX;
  this.y0 = originY;
  this.distX = originX - destinationX;
  this.distY = originY - destinationY;
  this.pct = 0.0;
  this.x = 0.0;
  this.y = 0.0;
  this.pop = pop;
  this.idD = idD;
  this.idO = idO;
  this.particleSize =  map(pop, 1, maxPop, 2, 50);
  this.update = function(){
    this.pct += map(this.pop, 1, maxPop, track.value / 1000, 0.001);
    this.x = originX - this.pct * this.distX;
    this.y = originY - this.pct * this.distY;
  }
  this.show = function(){
    fill(lerpColor(color(255, 255, 0), color(255, 0, 0), this.pct));
    ellipse(this.x, this.y, this.particleSize, this.particleSize);
    if (trail.checked) {
      stroke(255,255,255,25);
      strokeWeight(1);
      line(this.x0, this.y0, this.x, this.y);
    }
  }
}

function numberWithDots(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
