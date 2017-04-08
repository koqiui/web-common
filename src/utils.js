/**
 * Created by koqiui on 2017-04-08.
 */
import Lo from 'lodash'

export class StringBuilder {
    constructor(...args) {
        this.value = '';
        //
        this.append(args);
    }

    append(...args) {
        for (let i = 0, c = args.length; i < c; i++) {
            this.value = this.value + args[i];
        }
    }

    appendln(...args) {
        this.append(args);
        this.append('\n');
    }

    prepend(...args) {
        for (let i = args.length - 1; i >= 0; i++) {
            this.value = args[i] + this.value;
        }
    }

    clear() {
        this.value = '';
    }

    toString() {
        return this.value;
    }
}

Object.assign(String, {
    builder: function (...args) {
        return new StringBuilder(args);
    }
});

export default  {}