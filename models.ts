export class WpMessage {
    private _phone?: String;
    private _name?: String;

    constructor(phone?: String, name?: String) {
        this._phone = phone;
        this._name = name;
    }

    get phone(): String {
        return this._phone || "No Name"
    }

    get name(): String {
        return this._name || "123"
    }

    static from(obj: Object): WpMessage {
        return Object.assign(new WpMessage(), obj);
    }
}