export type ModuleData = Record<string, VarName>;

export type VarName = Record<string, VarData>;

interface VarData {
    type: string;
    value: unknown;
    encoded_name: string;
}

// This class hold the information of variables and real-time value of variables
export class DataManager {
    // key: encoded name, value: real-time value
    _data: Record<string, unknown>;
    // Initial data fetched from taipy-gui backend
    _init_data: ModuleData;

    constructor(variableModuleData: ModuleData) {
        this._data = {};
        this._init_data = {};
        this.init(variableModuleData);
    }

    init(variableModuleData: ModuleData) {
        // Identify changes between the new and old data
        const changes: ModuleData = {};
        for (const context in this._init_data) {
            if (!(context in variableModuleData)) {
                changes[context] = this._init_data[context];
                continue;
            }
            for (const variable in this._init_data[context]) {
                if (!(variable in variableModuleData[context])) {
                    if (!(context in changes)) {
                        changes[context] = {};
                    }
                    changes[context][variable] = this._init_data[context][variable];
                }
            }
        }
        if (Object.keys(changes).length !== 0) {
            console.error("Unmatched data tree! Removed changes: ", changes);
        }
        // Reset the initial data
        this._init_data = variableModuleData;
        this._data = {};
        for (const context in this._init_data) {
            for (const variable in this._init_data[context]) {
                const vData = this._init_data[context][variable];
                this._data[vData["encoded_name"]] = vData.value;
            }
        }
    }

    getEncodedName(varName: string, module: string): string | undefined {
        if (module in this._init_data && varName in this._init_data[module]) {
            return this._init_data[module][varName].encoded_name;
        }
        return undefined;
    }

    // return [name, moduleName]
    getName(encodedName: string): [string, string] | undefined {
        for (const context in this._init_data) {
            for (const variable in this._init_data[context]) {
                const vData = this._init_data[context][variable];
                if (vData.encoded_name === encodedName) {
                    return [variable, context];
                }
            }
        }
        return undefined;
    }

    get(encodedName: string): unknown {
        if (!(encodedName in this._data)) {
            throw new Error(`${encodedName} is not available in Taipy Gui`);
        }
        return this._data[encodedName];
    }

    getInfo(encodedName: string): VarData | undefined {
        for (const context in this._init_data) {
            for (const variable in this._init_data[context]) {
                const vData = this._init_data[context][variable];
                if (vData.encoded_name === encodedName) {
                    return { ...vData, value: this._data[encodedName] };
                }
            }
        }
        return undefined;
    }

    getDataTree(): ModuleData {
        return this._init_data;
    }

    getAllData(): Record<string, unknown> {
        return this._data;
    }

    update(encodedName: string, value: unknown) {
        if (!(encodedName in this._data)) {
            throw new Error(`${encodedName} is not available in Taipy Gui`);
        }
        this._data[encodedName] = value;
    }
}
