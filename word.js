/**
 * Created by betrayer on 27.12.14.
 */
var extend = require('node.extend');

var Word = function(source, variants){
    var that = this;
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

module.exports = Word;