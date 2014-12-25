/**
 * Created by betrayer on 24.12.14.
 */
var fs = require('fs');
var encoding = require('encoding');

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
    that.load();
};

Dic.prototype.load = function() {
    var that = this;
    var path = that.options.lang ? ('dic/'+that.options.lang+'.json'): 'dic/en.json';
    fs.readFile(path, function(err, file) {
        if (err) {
            that.exit(err);
            return;
        }
        setTimeout(function() {
            that.v = JSON.parse(file);
            if (that.callback) {
                var c = that.callback;
                delete that.callback;
                c(null, that);
            }
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
    if (!options) {
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
                    source.rules[rule[0]] = {
                        type: rule[2],
                        info: rule[3] ? rule[3].split(',') : []
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
Dic.prototype.mine = function(options) {
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
                    paradigma.straight[inst[0]] = {
                        rule: inst[1],
                        prefix: inst[2]
                    }
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
        that.v.prefixes = source.prefixes;
        that.v.rules = source.rules;
        var path = options.path || 'dic/' + options.lang + '.json';
        that.store(path);
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
        "МС-П": "Pronoun:adjective", //todo what the fuck is П?!
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
        "*": "Any"
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
