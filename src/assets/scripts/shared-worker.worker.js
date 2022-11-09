connections = [];

self.onconnect = function(connectEvent) {
    const port = connectEvent.ports[0];
 
    port.start();
    connections.push(port);
    
    port.onmessage = function(messageEvent) {
        connections.forEach(connection => {
            connection.postMessage(messageEvent.data);
        });
    }
};