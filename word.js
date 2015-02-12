/**
 * Created by betrayer on 27.12.14.
 */
"use strict";
var extend = require('node.extend');

var Word = function(source, variants, vocabulary){
    var that = this;
    that.vocabulary = vocabulary.v;
    that.lang = vocabulary.options.lang;
    that.parse(variants);
    that.source = source;
};

Word.prototype.parse = function(variants) {
    var that = this;
    that.variants = [];
    for (var i = 0; i < variants.length; ++i) {
        var base = {
            assumption: variants[i].assumption,
            weight: variants[i].weight
        };
        if (variants[i].base) {
            var common = variants[i].base.info;
            for (var j = 0; j < common.length; ++j) {
                var basePair = common[j].split(":");
                base[basePair[0]] = basePair[1];
            }
            base.type = variants[i].base.type;
        }
        var flag = false;
        for (var k = 0; k < variants[i].variants.length; k++) {
            var variant = {};
            extend(variant, base);
            var props = variants[i].variants[k].info;
            for (var l = 0; l < props.length; ++l) {
                var pair = props[l].split(':');
                variant[pair[0]] = pair[1];
            }
            if (variants[i].variants[k].type !== "All") {
                variant.type = variants[i].variants[k].type;
            }
            that.variants.push(variant);
            flag = true;
        }
        if (!flag) {
            that.variants.push(base);
        }
    }
    that.variants.sort(function (a, b) {
        if (a.weight > b.weight) {
            return -1;
        }
        if (a.weight < b.weight) {
            return 1;
        }
        return 0;
    });
    that.activeVariant = 0;
};

Word.prototype.grammar = function(all) {
    var that = this;
    var answer = "";
    var array;
    if (!all) {
        array = that.variants.slice(that.activeVariant, that.activeVariant+1);
    } else {
        array = that.variants;
    }
    for (var i = 0; i < array.length; ++i) {
        var string = "";
        var info = array[i];
        for (var key in info) {
            if (info.hasOwnProperty(key) && key !== "weight"&& key !== "assumption") {
                string += key + ": " + info[key]+"; ";
            }
        }
        answer += string.slice(0, -1) + "\n";
    }
    return answer.slice(0, -1);
};

Word.prototype.otherVariant = function() {
    var that = this;
    if (that.activeVariant < that.variants.length) {
        ++that.activeVariant;
    } else {
        that.activeVariant = 0;
    }
};

Word.prototype.toString = function() {
    return this.source;
};

Word.prototype.getBase = function() {
    var that = this;
    var variant = that.variants[that.activeVariant];
    if (!variant) return;
    var filter = [];
    var antiFilter = [];
    var paradigma = that.vocabulary.paradigmas[variant.assumption.paradigma].reverse;
    var type = variant.type;
    switch (variant.type) {
        case "Noun":
            filter = ["Case:nom", "Plural:false", "Gender:"+variant.Gender];
            break;
        case "Adjective":
        case "Adjective:short":
            type = "Adjective";
            filter = ["Case:nom", "Plural:false", "Gender:male"];
            antiFilter = ["Degree:superlative", "Degree:comparative"];
            break;
        case "Verb":
        case "Verb:base":
            filter = ["1"];
            if (that.lang = "ru") {
                type = "Verb:base";
            }
            else {
                filter = ["VerbType:infinitive"]
            }
            break;
        case "Pronoun:adjective":
            filter = ["Case:nom", "Gender:male", "Face:1st"];
            break;
        case "Pronoun":
            filter = ["Case:nom"];
            antiFilter = ["Plural:true"];
            break;
        case "Participle":
            filter = ["Case:nom", "Plural:false", "Gender:male", "Time:present"]

    }
    var r = that.vocabulary.rules;
    var collecting = [];
    for (var rule in paradigma) {
        if (paradigma.hasOwnProperty(rule) && r[rule].type === type) {
            collecting.push(rule);
        }
    }
    var info, flag, array;
    for (var i = 0; i < filter.length; ++i) {
        if (collecting.length <= 1) break;
        array = [];
        for (var j = 0; j < collecting.length; ++j) {
            info = that.vocabulary.rules[collecting[j]].info;
            flag = false;
            for (var k = 0; k < info.length; ++k) {
                if (info[k] == filter[i]) {
                    flag = true;
                    break;
                }
            }
            if (flag) {
                array.push(collecting[j]);
            }
        }
        collecting = array;
    }
    for (var t = 0; t < antiFilter.length; ++t) {
        if (collecting.length <= 1) break;
        array = [];
        for (var u = 0; u < collecting.length; ++u) {
            info = that.vocabulary.rules[collecting[u]].info;
            flag = true;
            for (var w = 0; w < info.length; ++w) {
                if (info[w] == antiFilter[t]) {
                    flag = false;
                    break;
                }
            }
            if (flag) {
                array.push(collecting[u]);
            }
        }
        collecting = array;
    }
    var answer = "";
    if (collecting && collecting[0]) {
        var key = collecting[0];
        answer = ((paradigma[key].prefix || "") + variant.assumption.base + (paradigma[key].ending || "")).toLowerCase();
    }

    return answer;
};

module.exports = Word;

