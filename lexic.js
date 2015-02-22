/**
 * Created by betrayer on 24.12.14.
 */
"use strict";
var Dictionary = require('./dictionary');
var Word = require('./word');

var Lexic = function(options, callback) {
    var that = this;
    if (!options || typeof options == "function") {
        callback = options || undefined;
        options = {};
    }
    that.options = options;
    new Dictionary(options, function(err, dic) {
        that.dictionary = dic;
        callback.call(that, err);
    });
};

Lexic.prototype.analys = function(text) {
    var that = this;
    var reg = /(?:\.|!|\?|\.\.\.)\s*(?:[A-Z]|[А-ЯЁ])/;
    var array = [];
    var res = reg.exec(text);
    while (res) {
        array.push(text.slice(0, text.indexOf(res)+res[0].length - 1));
        text = text.slice(text.indexOf(res)+res[0].length - 1);
        res = reg.exec(text);
    }
    array.push(text);
    return array;
};

Lexic.prototype.findWord = function(word) {
    return new Word(word, this.dictionary.parse(word, true), this.dictionary);
};

module.exports.create = function(options, callback) {
    new Lexic(options, callback);
};

new Lexic({lang:'ru'}, function(err) {
    var that = this;
    if (err) throw err;
    //console.log(dic.v.rules);
    //dic.mine({dic:'../vocs/Morph/RusSrc/morphs.mrd', lang:'ru', gram:'../vocs/Morph/rgramtab.tab'}, function(err) {
        //if (err) throw err;
        //dic.mine({dic:'../vocs/Morph/EngSrc/morphs.mrd', lang:'en', gram:'../vocs/Morph/egramtab.tab'}, function(err) {
        //    if (err) throw err;
        //    dic.mine({dic:'../vocs/Morph/GerSrc/morphs.mrd', lang:'de', gram:'../vocs/Morph/ggramtab.tab'});
        //});
    //});

    var regexp = /[А-ЯЁа-яё]+/;
    var str = "Здравствуй мой маловероятный посетитель! " +
        "Позволь немного рассказать о себе. Я - молодой, строящийся " +
        "веб ресурс.Моя цель - быть маленьким и тихим уголком интернета," +
        " где ты сможешь комфортно провести время в компании великолепной музыки "+
        "и своих друзей. К сожалению, моя разработка процесс очень трудозатратный, а"+
        " команда моих разработчиков весьма немногочисленна, но, возможно, ты - именно "+
        "тот, кто может мне помочь! Если ты разработчик, дизайнер, верстальщик или просто "+
        "идейный человек от всей души желающий помочь мне вырасти в серьёзный проект - пиши вот" +
        " на этот электронный адрес the.betrayer64@gmail.com, серьёзно, мне пригодится любая помощь!" +
        " Если же ты не готов заниматься разработкой, но, все равно, очень хочешь помочь - пожалуйста, зарегистрируйся" +
        " и попробуй протестировать мой функционал. Наверняка, у тебя найдётся пара идей или советов, которые ты можешь дать" +
        " моим разработчикам! Несмотря на моё амбициозное имя, мой функционал пока не столь велик и работаю я, скорее всего, в " +
        "тестовом режиме. Но ты можешь вести свой блог, " +
        "обмениваться личными сообщениями с другими пользователями, " +
        "(грабить корованы... шучу, пока не можешь) загружать и комментировать " +
        "фотографии. Большое спасибо за внимание, чувствуй себя как дома!";

    console.log(that.findWord(str));
});