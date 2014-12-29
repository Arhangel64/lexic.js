# lexic.js

Lexic analyser

# Warning! It's not working now!

Now it's just a dictionaries, parsed to JSON. Sources of dictionaries mined from [aot.ru](http://aot.ru)

## Usage

```javascript
var Lexic = require('lexic');

Lexic.create({<options>}, function(error, dictionary) {
    if (err) throw err;
    // dictionary is a new dictionary
});
```

# Documentation

In that distribution there are 3 dictionary json's. They are pretty heavy, so, you may remove those you aren't
interested in. You may find them in `dic/` folder

## Module

### module.create(options, callback)

__Arguments__

* `options` - is an object of options.
* `callback` - is a function, there will be `err` and `dictionary` passed into a `callback`

__Options__

* `lang` - is a language of creating dictionary. Now it can be `ru`, `en`, `de`

## dictionary

It's a special object you've got to work with.

### dictionary.find(string)

Method to find and collect data about word. It returns special object - word

__Arguments__

* `string` - a word, you want to find and wrap. You should pass into only string with no spaces, dots, commas, and other stuff. You will just get nothing useful, following another way.

### dictionary.parse(string, deep)

Method returns an array of theories. It is low levelled, so, I don't expect anyone will use it.

Theory is an object.

__Theory properties__

* `variants` - array of grammar elements
* `base` - base grammar element of the theory
* `assumption` - is the assumption of theory. Contain base - hypothetical lemma of `string`, and ending - hypothetical ending of `string`

__Arguments__

* `string` - is a string you want to parse. The `string` should be in language, you passed to `options` of `Lexic.create()`.
* `deep` - boolean. `false` by default. If `true` method will try to find every possible variant in dictionary, no matter how many variants it already founded.

### dictionary.store(path, callback)

That method will help you to store loaded json. `callback` will be called with only `err`, if there will be smth wrong

### dictionary.mine(options, callback)

I don't expect anyone will use that method, [aot.ru](http://aot.ru) do not update their dictionaries.  That method will drop
 current loaded json dictionary, and may overwrite existing dictionaries, so, don't use it!

__Arguments__

* `options` - is an object of options.
* `callback` - `callback` will be called with only `err`, if there will be smth wrong

__Options__

* `dic` - is the path to main dictionary. Dictionary should be in [aot.ru](http://aot.ru) format. It often has extension `
.mrd`
* `lang` - the language of mining dictionary. It changes the `lang` of a `dictionary`
* `gram` - a grammar file, it often sounds like `egramtab.tab`, from [aot.ru](http://aot.ru) too
* `path` - path for storing json dictionary

###dictionary.load(callback)

A method to load json dictionary. It's only for initialization, don't use it!

## word

Word is an object of result. It has possible variants of grammar forms of source string inside of it. Variants are
int hre property word.variants

### word.toString()

Returns source string

### word.grammar([all])

Returns the string with description of the active variant of the grammar form of the word

__Arguments__

* `all` - boolean argument, `false` by default. If true = method will return information about all grammar forms.

### word.otherVariant()

Method will switch active variant of the grammar form.