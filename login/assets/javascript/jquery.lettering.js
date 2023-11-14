(function($) {
    const injector = (t, splitter, klass) => {
        const parts = t.text().split(splitter);
        if (parts.length) {
            const spans = [];
            parts.forEach((item, i) => {
                spans.push(`<span class="${klass}${i + 1}">${item}</span>`);
            });
            t.html(spans.join(""));
        }
    };

    const methods = {
        init() {
            return this.each(function() {
                injector($(this), "", "char");
            });
        },
        words() {
            return this.each(function() {
                injector($(this), " ", "word");
            });
        },
        lines() {
            return this.each(function() {
                const r = "eefec303079ad17405c889e092e105b0";
                const el = $(this);
                el.html(el.html().replace(/<br>/g, r));
                injector(el, r, "line");
            });
        }
    };

    $.fn.lettering = function(method) {
        if (method && methods[method]) {
            return methods[method].apply(this, [...arguments].slice(1));
        } else if (method === "letters" || !method) {
            return methods.init.apply(this, [...arguments]);
        }
        $.error(`Method ${method} does not exist on jQuery.lettering`);
        return this;
    };
})(jQuery);
