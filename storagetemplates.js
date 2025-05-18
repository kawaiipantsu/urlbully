const electron = require('electron');
const path = require('path');
const fs = require('fs');

class StorageTemplates {
    constructor() {
        const userDataPath = (electron.app || electron.remote.app).getPath('userData');
        this.path = path.join(userDataPath, '/templates/');
    }

    del(name) {
        const filePath = path.join(this.path, name + '.txt');
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    list() {
        if (!fs.existsSync(this.path)) {
            fs.mkdirSync(this.path);
        }
        const files = fs.readdirSync(this.path);
        const templates = [];
        files.forEach(file => {
            if (file.endsWith('.txt')) {
                const templateName = file.replace('.txt', '');
                const templateData = fs.readFileSync(path.join(this.path, file), 'utf8');
                templates.push({
                name: templateName,
                data: templateData,
                dataEncoded: btoa(templateData)
                });
            }
        });
        return templates;
    }

    add(name, data) {
        if (!fs.existsSync(this.path)) {
            fs.mkdirSync(this.path);
        }
        const filePath = path.join(this.path, name + '.txt');
        if (fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, data);
        } else {
            fs.writeFileSync(filePath, data);
        }
    }
}

module.exports = StorageTemplates;