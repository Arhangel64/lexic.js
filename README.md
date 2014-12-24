usage
var Dictionary = require('dictionary');

Dictionary.create({<options>}, function(error, dictionary) {
    if (err) throw err;
    // dictionary is a new dictionary
});

options {
    lang: "ru/en/de"
}

dictionary has property "v", it's a dictionary itself;

It has the next properties:

lemmas - is an object with lemmas as a key. It contain next objects types
{
    paradigma: <index in paradigmas array>

}