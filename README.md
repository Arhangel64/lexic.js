# lexic.js

Lexic analyser

# Warning! It's not working now!

Now it's just a dictionaries, parsed to JSON. Sources of dictionaries mined from [aot.ru](http://aot.ru)

## Usage

```javascript
var Dictionary = require('dictionary');

Dictionary.create({<options>}, function(error, dictionary) {
    if (err) throw err;
    // dictionary is a new dictionary
});
```

# Documentation

In that distribution there are 3 dictionary json's. They are pretty heavy, so, you may remove those you aren't
interested in. You may find them in 'dic/' folder

## Module

### module.create(options, callback)

__Arguments__

* `options` - is an object of options.
* `callback` - is a function, there will be `err` and `dictionary` passed into a `callback`

__Options__

* `lang` - is a language of creating dictionary. Now it can be `ru`, `en`, `de`

## dictionary

### dictionary.store(path, callback)

That method will help you to store loaded json. `callback` will be called with only `err`, if there will be smth wrong

###dictionary.load(callback)

A method to load json dictionary. It's only for initialization, don't use it!

### dictionary.mine(options, callback)

I don't expect anyone will use that method, [aot.ru](http://aot.ru) do not update their dictionaries.  That method will drop
 current loaded json dictionary, and may overwrite existing dictionaries, so, don't use it!

__Arguments__

* `options` - is an object of options.
* `callback` - `callback` will be called with only `err`, if there will be smth wrong

__Options__

* `dic` - is the path to main dictionary. Dictionary should be in [aot.ru](aot.ru) format. It often has extension `
.mrd`
* `lang` - the language of mining dictionary. It changes the 'lang' of a `dictionary`
* `gram` - a grammar file, it often sounds like `egramtab.tab`, from [aot.ru](http://aot.ru) too
* `path` - path for storing json dictionary