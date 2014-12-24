/**
 * Created by betrayer on 24.12.14.
 */
var fs = require('fs');
var encoding = require('encoding');
var source = '';

var Dic = function(options) {
    var that = this;
    if (!options) {
        options = {};
        that.getOptions(options);
    }
    var err = that.check(options);
    if (err) {
        that.exit(err);
    }
    that.options = options;
    that.read();
};

Dic.prototype.check = function(options) {
    if (!options.dic) {
        return 1;
    }
    if (!options.gram) {
        return 2;
    }
    if (!options.lang || !this.langs[options.lang]) {
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
    console.error('Error! '+ err.message);
    process.exit(err.code);
};
Dic.prototype.read = function() {
    var that = this;
    fs.readFile(that.options.dic, function(err, data) {
        if (err) {
            that.exit(err);
        }
        if (that.options.lang !== "en") {
            data = encoding.convert(data, "utf8", that.langs[that.options.lang].encoding);
        }
        data = data.toString();
        var split = data.split('\n');
        if (parseInt(split[0]) != split[0].toString()) {
            that.exit(3);
        }
        var endOfFirstSection = +split[0] + 1;
        that.paradigmas = split.slice(1, endOfFirstSection);
        var endOfSecondSection = +split[endOfFirstSection] + endOfFirstSection+1 ;
        that.accents = split.slice(endOfFirstSection+1, endOfSecondSection);
        var endOfThirdSection = +split[endOfSecondSection] + endOfSecondSection + 1;
        that.sessions = split.slice(endOfSecondSection + 1, endOfThirdSection);
        var endOfFourthSection = +split[endOfThirdSection] + endOfThirdSection + 1;
        that.prefixes = split.slice(endOfThirdSection+1, endOfFourthSection);
        var endOfFifthSection = +split[endOfFourthSection] + endOfFourthSection + 1;
        that.lexems = split.slice(endOfFourthSection+1, endOfFifthSection);
        console.log('Mined ' + that.paradigmas.length + ' paradigms');
        console.log('Mined ' + that.accents.length + ' accents');
        console.log('Mined ' + that.sessions.length + ' sessions');
        console.log('Mined ' + that.prefixes.length + ' prefixes sets');
        console.log('Mined ' + that.lexems.length + ' lexemes');
    });
};
Dic.prototype.langs = {
    ru: {
        encoding: "cp-1251"
    },
    ge: {
        encoding: "cp-1252"
    },
    en: {
        encoding: "utf8"
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

var dic = new Dic();