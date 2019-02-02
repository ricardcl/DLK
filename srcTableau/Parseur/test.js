var a = [];
a['a'] = "A";
a['b'] = "B";
a['c'] = "C";
console.log(a);
console.log(a['b']);
console.log(a['d']);
if (a['d'] == undefined) {
    console.log("cest undefined");
}
if (a['d'] !== undefined) {
    console.log("cest bien defini");
}
