/**
 * https://github.com/optimisme/gjs-examples
 *
 *
 */

const Gio   = imports.gi.Gio;
const GLib  = imports.gi.GLib;
const Lang  = imports.lang;

const SpawnReader = function () { };

SpawnReader.prototype.spawn = function (path, command, flags, func) {

    let pid, stdin, stdout, stderr, stream, reader;

    [res, pid, stdin, stdout, stderr] = GLib.spawn_async_with_pipes(
        path, command, null, flags, null);

//    global.log('Spawn.spawn()');
    stream = new Gio.DataInputStream({ base_stream : new Gio.UnixInputStream({ fd : stdout }) });
//    global.log('Spawn.spawn() dataInputStream');

    this.read(stream, func);
};

SpawnReader.prototype.read = function (stream, func) {
//    global.log('Spawn.read()');

    stream.read_line_async(GLib.PRIORITY_LOW, null, Lang.bind (this, function (source, res) {
//    global.log('Spawn.read_line_async()');

        let out, length;

        [out, length] = source.read_line_finish(res);
        //global.log('Spawn.read() ret: ' + out);
        if (out !== null) {
            func(out);
            this.read(source, func);
        }
        else{
            stream.close(null);
        }
    }));
};
