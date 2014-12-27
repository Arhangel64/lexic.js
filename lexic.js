/**
 * Created by betrayer on 24.12.14.
 */
var fs = require('fs');
var encoding = require('encoding');
var Word = require('./word');

var Dic = function(options, callback) {
    var that = this;
    if (!options || typeof options == "function") {
        callback = options || undefined;
        options = {};
        that.getOptions(options);
    }
    that.callback = callback;
    that.options = options;
    that.rules = {};
    that.load(that.callback);
};

Dic.prototype.find = function(word) {
    return new Word(word, this.parse(word, true));
};

Dic.prototype.parse = function(string, deep) {
    var that = this;
    var regexp;
    var answer = [];
    switch (that.options.lang) {
        case 'ru':
            regexp = /[А-ЯЁа-яё]/g;
            break;
        default :
            regexp = /[A-Za-z]/g;
            break;
    }
    if (string.replace(regexp, "") !== "") {
        return answer;
    }
    for (var i = string.length; i > 0; --i) {
        var key = string.slice(0, i).toUpperCase();
        var lemma = that.v.lemmas[key];
        if (lemma) {
            var ending = string.slice(i).toUpperCase();
            var theory = that.queryLemma(lemma, ending, key);
            for (var j = 0; j < theory.length; ++j) {
                theory[j].assumption.prefix = "";
                answer.push(theory[j]);
            }
            if (deep !== true && answer.length) {
                return answer;
            }
        }
    }
    var lastTheory = that.queryLemma(that.v.lemmas['#'], string);
    for (var k = 0; k < lastTheory.length; ++k) {
        lastTheory[k].assumption.prefix = "";
        answer.push(lastTheory[k]);
    }
    if (answer.length === 0 || deep) {
        var deprefixed = that.removePrefix(string);
        if (deprefixed) {
            var prefix = string.slice(0, string.length - deprefixed.length);
            var unprefixed = that.parse(deprefixed);
            for (var l = 0; l < unprefixed.length; ++l) {
                unprefixed[l].assumption.prefix = prefix + (unprefixed[l].assumption.prefix || "");
                answer.push(unprefixed[l]);
            }
        }
    }
    return answer;
};

Dic.prototype.queryLemma = function(lemma, ending, key) {
    var that = this;
    var answer = [];
    key = key || "";
    for (var l = 0; l < lemma.length; ++l) {
        var theory = {
            variants: [],
            weight: key.length || 0,
            base: that.v.rules[lemma[l].rule] || false,
            assumption: {
                ending: ending,
                base: key
            }
        };
        if (ending === "") ending = "empty";
        var paradigma = that.v.paradigmas[lemma[l].paradigma].straight[ending];
        if (paradigma) {
            for (var j = 0; j < paradigma.length; ++j) {
                theory.variants.push(that.v.rules[paradigma[j].rule]);
            }
        }
        if (theory.variants.length) {
            answer.push(theory);
        }
    }
    return answer;
};

Dic.prototype.removePrefix = function(string) {
    for (var i = 1; i <= string.length; ++i) {
        var pre = string.slice(0, i).toUpperCase();
        if (this.v.prefixes[pre]) {
            return string.slice(i);
        }
    }
    return false;
};

Dic.prototype.load = function(callback) {
    var that = this;
    var path = that.options.lang ? ('dic/'+that.options.lang+'.json'): 'dic/en.json';
    fs.readFile(path, function(err, file) {
        if (err) {
            callback ? callback(err):that.exit(err);
            return;
        }
        setTimeout(function() {
            that.v = JSON.parse(file);
            callback(null, that)
        }, 1);

    });
};

Dic.prototype.check = function(options) {
    if (!options.dic) {
        return 1;
    }
    if (!options.gram) {
        return 2;
    }
    if (!options.lang || !Dic.langs[options.lang]) {
        options.lang = "en";
        console.warn('Missing language ' + options.lang +", using english (en)!");
    }
    return 0;
};
Dic.prototype.getOptions = function(options) {
    process.argv.forEach(function (val, index) {
        if (index === 0 || index === 1) return;
        var str = val.replace(/\s/g, '');
        if (str.indexOf('dic=') === 0) {
            options.dic = str.replace('dic=', '');
        }
        if (str.indexOf('lang=') === 0) {
            options.lang = str.replace('lang=', '');
        }
        if (str.indexOf('gram=') === 0) {
            options.gram = str.replace('gram=', '');
        }
    });
};
Dic.prototype.exit = function (err) {
    if (typeof err == "number") {
        err = this.errors[err];
    }
    if (!this.callback) {
        console.error('Error! ' + err.message);
        throw err;
    } else {
        this.callback(new Error(err));
    }
};
Dic.prototype.import = function(options, callback) {
    var that = this;
    var source = {};
    if (!options || typeof options == "function") {
        callback = options;
        options = that.options;
    }
    if (typeof options == "function") {
        callback = options;
        options = that.options;
    }
    fs.readFile(options.dic, function(err, data) {
        if (err) {
            callback ? callback(err):that.exit(err);
            return;
        }
        if (options.lang !== "en") {
            data = encoding.convert(data, "utf8", Dic.langs[options.lang].encoding);
        }
        data = data.toString().replace(/\r/g, "");
        var split = data.split('\n');
        if (parseInt(split[0]) != split[0].toString()) {
            callback ? callback(that.errors[3]):that.exit(3);
            return;
        }
        var endOfFirstSection = +split[0] + 1;
        source.paradigmas = split.slice(1, endOfFirstSection);
        var endOfSecondSection = +split[endOfFirstSection] + endOfFirstSection+1 ;
        source.accetns = split.slice(endOfFirstSection+1, endOfSecondSection);
        var endOfThirdSection = +split[endOfSecondSection] + endOfSecondSection + 1;
        source.sessions = split.slice(endOfSecondSection + 1, endOfThirdSection);
        var endOfFourthSection = +split[endOfThirdSection] + endOfThirdSection + 1;
        source.prefixes = split.slice(endOfThirdSection+1, endOfFourthSection);
        var endOfFifthSection = +split[endOfFourthSection] + endOfFourthSection + 1;
        source.lexems = split.slice(endOfFourthSection+1, endOfFifthSection);
        fs.readFile(options.gram, function (err, data) {
            if (err) {
                callback ? callback(err) : that.exit(err);
                return;
            }
            if (options.lang !== "en") {
                data = encoding.convert(data, "utf8", Dic.langs[options.lang].encoding);
            }
            data = data.toString().replace(/\r/g, "");
            var split = data.split('\n');
            var reg;
            switch (options.lang) {
                case "ru":
                    reg = /[А-ЯЁа-яё]{2}/;
                    break;
                default:
                    reg = /[A-Za-z]{2}/;
            }
            source.counter = 0;
            source.rules = {};
            for (var i = 0; i < split.length; ++i) {
                if (reg.test(split[i].slice(0, 2))) {
                    var rule = split[i].split(' ');
                    var info = [];
                    if (rule[3]) {
                        var temp = rule[3].split(',');
                        for (var j = 0; j < temp.length; ++j) {
                            var rul = Dic.gmap[options.lang][temp[j]];
                            if (rul) {
                                info.push(rul);
                            }
                        }
                    }
                    source.rules[rule[0]] = {
                        type: Dic.gmap[options.lang][rule[2]] || 'All',
                        info: info
                    };
                    source.counter++;
                }
            }
            console.log('Mined ' + source.paradigmas.length + ' paradigms');
            console.log('Mined ' + source.accetns.length + ' accents');
            console.log('Mined ' + source.sessions.length + ' sessions');
            console.log('Mined ' + source.prefixes.length + ' prefixes sets');
            console.log('Mined ' + source.lexems.length + ' lexemes');
            console.log('Mined ' + source.counter + ' rules');
            callback(null, source);
        });
    });
};
Dic.prototype.mine = function(options, callback) {
    var that = this;
    options = options || that.options;
    that.options.lang = options.lang;
    var err = that.check(options);
    if (err) {
        that.exit(err);
    }
    that.import(options, function(err, source) {
        if (err) that.exit(err);
        that.v = {};
        that.v.lemmas = {};
        for (var i = 0; i < source.lexems.length; ++i) {
            var lex = source.lexems[i].split(' ');
            if (!that.v.lemmas[lex[0]]) {
                that.v.lemmas[lex[0]] = [];
            }
            that.v.lemmas[lex[0]].push({
                paradigma: lex[1],
                asset: lex[2],
                rule: lex[4] == "-" ? false : lex[4]
            });
        }
        that.v.paradigmas = [];
        for (var j = 0; j < source.paradigmas.length; ++j) {
            var temp = source.paradigmas[j].split('%');
            var paradigma = {
                straight: {
                    empty: []
                },
                reverse: {}
            };
            for (var k = 1; k < temp.length; ++k) {
                var inst = temp[k].split('*');
                if (inst[0]) {
                    if (!paradigma.straight[inst[0]]) {
                        paradigma.straight[inst[0]] = [];
                    }
                    paradigma.straight[inst[0]].push({
                        rule: inst[1],
                        prefix: inst[2]
                    })
                } else {
                    paradigma.straight.empty.push({
                        rule: inst[1],
                        prefix: inst[2]
                    })
                }
                paradigma.reverse[inst[1]] = {
                    ending: inst[0],
                    prefix: inst[2]
                }
            }
            that.v.paradigmas.push(paradigma);
        }
        that.v.accents = [];
        for (var l = 0; l < source.accetns.length; ++l) {
            var accent = source.accetns[l].split(';');
            accent.pop();
            that.v.accents.push(accent);
        }
        that.v.prefixes = {};
        for (var m = 0; m < source.prefixes.length; ++m) {
            that.v.prefixes[source.prefixes[i]] = true;
        }
        that.v.rules = source.rules;
        var path = options.path || 'dic/' + options.lang + '.json';
        that.store(path, callback);
    });
};
Dic.prototype.store = function(path, callback) {
    var that = this;
    if (typeof path == "function") {
        callback = path;
        path = path || 'dic/'+that.options.lang+'.json';
    }
    path = path || 'dic/'+that.options.lang+'.json';
    fs.writeFile(path, JSON.stringify(that.v), function(err) {
        if (err) {
            callback ? callback(err):that.exit(err);
            return;
        }
        console.log('Dictionary stored to ' + path);
        if (callback) {
            callback(null);
        }
    });
};
Dic.langs = {
    ru: {
        encoding: "cp-1251"
    },
    de: {
        encoding: "cp-1252"
    },
    en: {
        encoding: "utf8"
    }
};
Dic.gmap = {
    ru: {
        "С": "Noun",
        "П": "Adjective",
        "КР_ПРИЛ": "Adjective:short",
        "ИНФИНИТИВ": "Verb:base",
        "Г": "Verb",
        "ДЕЕПРИЧАСТИЕ": "Adverb:participle",
        "ПРИЧАСТИЕ": "Participle",
        "КР_ПРИЧАСТИЕ": "Participle:short",
        "МС": "Pronoun",
        "МС-П": "Pronoun:adjective",
        "МС-ПРЕДК": "Pronoun:predicative",
        "ЧИСЛ": "Numeral",
        "ЧИСЛ-П": "Numeral:ordered",
        "Н": "Adverb",
        "ПРЕДК": "Predicative",
        "ПРЕДЛ": "Preposition",
        "СОЮЗ": "Union", //don't know how to translate,
        "МЕЖД": "Interjection",
        "ЧАСТ": "Part",
        "ВВОДН": "Parenthesis",
        "*": "Any",
        "мр": "Gender:male",
        "жр": "Gender:female",
        "ср": "Gender:middle",
        "од": "Living:true",
        "но": "Living:false",
        "ед": "Plural:false",
        "мн": "Plural:true",
        "им": "Case:nom",
        "рд": "Case:gen",
        "дт": "Case:dat",
        "вн": "Case:acc",
        "тв": "Case:ins",
        "пр": "Case:pre",
        "зв": "Case:voc",
        "св": "Finalized:true",
        "нс": "Finalized:false",
        "пе": "Transitive:true",
        "нп": "Transitive:false",
        "дст": "VoiceActive:true",
        "стр": "VoiceActive:false",
        "нст": "Time:present",
        "прш": "Time:past",
        "буд": "Time:future",
        "пвл": "Imperative:true",
        "1л": "Face:1st",
        "2л": "Face:2nd",
        "3л": "Face:3rd",
        "0": "Stable:true",
        "кр": "Short:true",
        "сравн": "Degree:comparative",
        "имя": "Name:first",
        "фам": "Name:last",
        "отч": "Name:middle",
        "лок": "Misc:location",
        "орг": "Misc:organization",
        "кач": "Qualifying:true",
        "вопр": "AdverbType:question",
        "относн": "AdverbType:relative",
        "дфст": "Misc:noPlural",
        "опч": "Misc:typo",
        "жарг": "Misc:slang",
        "арх": "Misc:archaism",
        "проф": "Misc:professionWord",
        "аббр": "Misc:abbreviation",
        "безл": "Misc:noFace"
    },
    en: {
        "ADJ": "Adjective",
        "ADV": "Adverb",
        "VERB": "Verb",
        "VBE": "Verb:toBe",
        "MOD": "Verb:modal",
        "NUMERAL": "Numeral",
        "ORDNUM": "Numeral:ordered",
        "CONJ": "Union",
        "INT": "Interjection",
        "PREP": "Preposition",
        "PART": "Part",
        "ART": "Article",
        "NOUN": "Noun",
        "PN": "Pronoun",
        "PRON": "Pronoun:stable",
        "PN_ADJ": "Pronoun:adjective",
        "POS": "Possessive",
        "pred": "PronounType:predicative",
        "attr": "PronounType:attributive",
        "pos": "Degree:positive",
        "comp": "Degree:comparative",
        "sup": "Degree:superlative",
        "inf": "VerbType:infinitive",
        "prsa": "VerbTime:present",
        "pasa": "VerbTime:past",
        "sg": "Plural:false",
        "pl": "Plural:true",
        "1": "Face:1st",
        "2": "Face:2nd",
        "3": "Face:3rd",
        "uncount": "Misc:noPlural",
        "pp": "VerbTime:presentPerfect",
        "ing": "VerbType:continuous",
        "fut": "VerbToBeTime:future",
        "if": "VerbToBeCondition",
        "pers": "PronounType:personal",
        "poss": "PronounType:possessive",
        "ref": "PronounType:reflexive",
        "dem": "PronounType:demonstrative",
        "nom": "Case:nom",
        "obj": "Case:obj",
        "m": "Gender:male",
        "f": "Gender:female",
        "anim": "Living:true",
        "narr": "Misc:narritial",
        "geo": "Misc:location",
        "prop": "Misc:proper",
        "mass": "Misc:massive"
    },
    de: {

    }
};
Dic.prototype.errors = [
    {
        code: 0,
        message: "Success!"
    },
    {
        code: 1,
        message: "Dictionary file path is undefined! Use 'dic=' option to specify the path."
    },
    {
        code: 2,
        message: "Grammar file path is undefined! Use 'gram=' option to specify the path."
    },
    {
        code: 3,
        message: "Wrong dictionary type."
    }
];
module.exports.create = function(options, callback) {
    new Dic(options, callback);
};

new Dic({lang:'ru'}, function(err, dic) {
    if (err) throw err;
    //console.log(dic.v.rules);
    //dic.mine({dic:'../vocs/Morph/RusSrc/morphs.mrd', lang:'ru', gram:'../vocs/Morph/rgramtab.tab'}, function(err) {
    //    if (err) throw err;
    //    dic.mine({dic:'../vocs/Morph/EngSrc/morphs.mrd', lang:'en', gram:'../vocs/Morph/egramtab.tab'}, function(err) {
    //        if (err) throw err;
    //        dic.mine({dic:'../vocs/Morph/GerSrc/morphs.mrd', lang:'de', gram:'../vocs/Morph/ggramtab.tab'});
    //    });
    //});
    var str = "Маленький шаг для человечества и огромный прыжок для меня";
    var arr = str.split(" ");
    var date = + new Date();
    for (var i = 0; i < arr.length; ++i) {
        console.log(dic.find(arr[i]).variants);
    }
    var date2 = + new Date();
    console.log('it took me for '+ (date2 - date) + 'ms');
});