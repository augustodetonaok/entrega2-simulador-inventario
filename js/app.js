  let productos = [];

  const formProducto = document.getElementById("formProducto");
  const listaProductos = document.getElementById("listaProductos");

  const productosGuardados = localStorage.getItem("productos");

  if (productosGuardados) {
    productos = JSON.parse(productosGuardados);
    ordenarProductos();
    mostrarProductos();
  }

  function crearProducto(nombre, cantidad, precio) {
    return {
      nombre: nombre,
      cantidad: cantidad,
      precio: precio
    };
  }

  function ordenarProductos() {
    productos.sort(function (a, b) {
        if (a.nombre.toLowerCase() < b.nombre.toLowerCase()) {
            return -1;
        }
        if (a.nombre.toLowerCase() > b.nombre.toLowerCase()) {
            return 1;
        }
        return 0;
    });
}


formProducto.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const nombre = document.getElementById("nombreProducto").value;
    const cantidad = parseInt(document.getElementById("cantidadProducto").value);
    const precio = parseFloat(document.getElementById("precioProducto").value);

    agregarProducto(nombre, cantidad, precio);
    formProducto.reset();

});


function agregarProducto(nombre, cantidad, precio) {
    let productoExistente = productos.find(p => p.nombre === nombre);

    if (productoExistente) {
        productoExistente.cantidad += cantidad;
        productoExistente.precio = precio; // actualiza precio
    } else {
        const producto = crearProducto(nombre, cantidad, precio);
        productos.push(producto);
    }

    guardarProductos();
    mostrarProductos();
}


function mostrarProductos() {
    listaProductos.innerHTML = "";

    productos.forEach((producto, indice) => {
        const div = document.createElement("div");

        div.classList.add("producto-item");

        div.innerHTML = `
            <p>
                <strong>${producto.nombre}</strong><br>
                Stock: ${producto.cantidad}<br>
                Precio: $${producto.precio}
            </p>
            <div class="botones">
                <button onclick="sumarStock(${indice})">➕</button>
                <button onclick="restarStock(${indice})">➖</button>
                <button onclick="eliminarProducto(${indice})">🗑</button>
            </div>
        `;

        listaProductos.appendChild(div);
    });
    calcularValorTotal();

}


function sumarStock(indice) {
    productos[indice].cantidad += 1;
    guardarProductos();
    mostrarProductos();
}

function restarStock(indice) {
    if (productos[indice].cantidad > 0) {
        productos[indice].cantidad -= 1;
        guardarProductos();
        mostrarProductos();
    }
}

function eliminarProducto(indice) {
    productos.splice(indice, 1);
    guardarProductos();
    mostrarProductos();
}

function guardarProductos() {
    localStorage.setItem("productos", JSON.stringify(productos));
    ordenarProductos();
}

function calcularValorTotal() {
    let total = 0;

    productos.forEach(producto => {
        total += producto.cantidad * producto.precio;
    });

    document.getElementById("valorTotal").textContent =
        "Valor total del inventario: $" + total.toLocaleString();
}



if (productosGuardados) {
  productos = JSON.parse(productosGuardados);

  productos.forEach(p => {
    if (!p.precio) {
      p.precio = 0;
    }
  });

  ordenarProductos();
  mostrarProductos();
}
