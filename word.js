/**
 * Created by betrayer on 27.12.14.
 */
var extend = require('node.extend');

var Word = function(source, variants){
    var that = this;
    var priced = that.price(variants);
    var vars = that.conclude(priced);
    var remaked = that.reprice(vars);
    that.suggest(remaked);
    that.source = source;
};
Word.prototype.price = function(array) {
    var paradigmas = {};
    for (var i = 0; i < array.length; ++i) {
        var theory = array[i];
        var types = {};
        var common = {};
        if (theory.base) {
            var baseInfo = theory.base.info;
            if (theory.base.type !== "Any") {
                if (!types[theory.base.type]) {
                    types[theory.base.type] = {score:0};
                }
                types[theory.base.type].score = types[theory.base.type].score + theory.weight;
                for (var k = 0; k < baseInfo.length; ++k) {
                    var baseProp = baseInfo[k].split(":");
                    if (!types[theory.base.type][baseProp[0]]) {
                        types[theory.base.type][baseProp[0]] = {};
                    }
                    if (!types[theory.base.type][baseProp[0]][baseProp[1]]) {
                        types[theory.base.type][baseProp[0]][baseProp[1]] = 0;
                    }
                    types[theory.base.type][baseProp[0]][baseProp[1]] = theory.weight + types[theory.base.type][baseProp[0]][baseProp[1]];
                }
            } else {
                for (var l = 0; l < baseInfo.length; ++l) {
                    var commonBaseProp = baseInfo[l].split(":");
                    //if (!common[commonBaseProp[0]]) {
                    //    common[commonBaseProp[0]] = {};
                    //}
                    //if (!common[commonBaseProp[0]][commonBaseProp[1]]) {
                    //    common[commonBaseProp[0]][commonBaseProp[1]] = 0;
                    //}
                    //common[commonBaseProp[0]][commonBaseProp[1]] = theory.weight + common[commonBaseProp[0]][commonBaseProp[1]];
                    common[commonBaseProp[0]] = commonBaseProp[1]
                }
            }
        }
        for (var j = 0; j < theory.variants.length; ++j) {
            var variant = theory.variants[j];
            var info = variant.info;
            if (variant.type !== "All") {
                if (!types[variant.type]) {
                    types[variant.type] = {score:0};
                }
                types[variant.type].score = types[variant.type].score + theory.weight;
                for (var m = 0; m < info.length; ++m) {
                    var prop = info[m].split(":");
                    if (!types[variant.type][prop[0]]) {
                        types[variant.type][prop[0]] = {};
                    }
                    if (!types[variant.type][prop[0]][prop[1]]) {
                        types[variant.type][prop[0]][prop[1]] = 0;
                    }
                    types[variant.type][prop[0]][prop[1]] = types[variant.type][prop[0]][prop[1]] + theory.weight;
                }
            } else {
                for (var n = 0; n < baseInfo.length; ++n) {
                    var commonProp = info[n].split(":");
                    //if (!common[commonProp[0]]) {
                    //    common[commonProp[0]] = {};
                    //}
                    //if (!common[commonProp[0]][commonProp[1]]) {
                    //    common[commonProp[0]][commonProp[1]] = 0;
                    //}
                    //common[commonProp[0]][commonProp[1]] = common[commonProp[0]][commonProp[1]] + theory.weight;
                    common[commonProp[0]] = commonProp[1]
                }
            }
        }
        paradigmas[theory.assumption.paradigma] = {
            common: common,
            types: types,
            assumption: theory.assumption
        }
    }
    return paradigmas;
};
Word.prototype.suggest = function(array) {
    var that = this;
    var main = array.splice(0, 1)[0];
    that.info = {};
    for (var key in main) {
        if (main.hasOwnProperty(key)) {
            that.info[key] = main[key];
        }
    }
    that.variants = array;
};

Word.prototype.reprice = function(array) {
    for (var i=0; i<array.length; ++i) {
        if (array[i].type === "Interjection") {
            --array[i].weight;
        }
    }

    array.sort(function (a, b) {
        if (a.weight > b.weight) {
            return -1;
        }
        if (a.weight < b.weight) {
            return 1;
        }
        return 0;
    });
    return array
};

Word.prototype.grammar = function() {
    var that = this;
    var answer = "";
    for (var key in that.info) {
        if (that.info.hasOwnProperty(key) && key !== "weight"&& key !== "assumption") {
            answer += key + ": " + that.info[key]+"; ";
        }
    }
    return answer.slice(0, -1);
};

Word.prototype.conclude = function(obj) {
    var variants = [];
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            var paradigma = obj[p];
            var common = {};
            for (var com in paradigma.common) {
                if (paradigma.common.hasOwnProperty(com)) {
                    common[com] = paradigma.common[com];
                }
            }
            for (var key in paradigma.types) {
                if (paradigma.types.hasOwnProperty(key)) {
                    var firstType = {
                        type: key,
                        weight: paradigma.types[key].score,
                        assumption: paradigma.assumption
                    };
                    extend(firstType,common);
                    var types = [firstType];
                    for (var prop in paradigma.types[key]) {
                        if (paradigma.types[key].hasOwnProperty(prop)) {
                            var property = paradigma.types[key][prop];
                            for (var value in property) {
                                if (property.hasOwnProperty(value)) {
                                    var flag = false;
                                    for (var i = 0; i < types.length; ++i) {
                                        if (types[i][prop] === undefined || types[i][prop] === value) {
                                            types[i][prop] = value;
                                            flag = true;
                                            break;
                                        }
                                    }
                                    if (!flag) {
                                        var newType = {};
                                        extend(newType, types[0] || {});
                                        newType[prop] = value;
                                        types.push(newType);
                                    }
                                }
                            }
                        }
                    }
                    for (var j = 0; j < types.length; ++j) {
                        variants.push(types[j]);
                    }
                }
            }
        }
    }
    return variants;
};
Word.prototype.toString = function() {
    return this.source;
};

module.exports = Word;