NAME := "activitywatch-status"
DOMAIN := "dpiotrkowski.github.io"

pack:
    mkdir dist || true
    cp extension.js metadata.json stylesheet.css README.md dist/
    cd dist && zip ../{{NAME}}.zip -9r .

install:
    touch ~/.local/share/gnome-shell/extensions/{{NAME}}@{{DOMAIN}}
    rm -rf ~/.local/share/gnome-shell/extensions/{{NAME}}@{{DOMAIN}}
    mv dist ~/.local/share/gnome-shell/extensions/{{NAME}}@{{DOMAIN}}

clean:
    rm -rf dist {{NAME}}.zip
