document.addEventListener("DOMContentLoaded", function () {

  let productos = [];

  const formProducto = document.getElementById("formProducto");
  const listaProductos = document.getElementById("listaProductos");

  const productosGuardados = localStorage.getItem("productos");

  if (productosGuardados) {
    productos = JSON.parse(productosGuardados);
    ordenarProductos();
    mostrarProductos();
  }

  function crearProducto(nombre, cantidad) {
    return {
      nombre: nombre,
      cantidad: cantidad
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
    let cantidad = document.getElementById("cantidadProducto").value;

    cantidad = parseInt(cantidad);

    agregarProducto(nombre, cantidad);
    formProducto.reset();
  });

  function agregarProducto(nombre, cantidad) {
    let productoExistente = null;

    for (let i = 0; i < productos.length; i++) {
      if (productos[i].nombre === nombre) {
        productoExistente = productos[i];
      }
    }

    if (productoExistente) {
      productoExistente.cantidad += cantidad;
    } else {
      const producto = crearProducto(nombre, cantidad);
      productos.push(producto);
    }

    ordenarProductos();
    localStorage.setItem("productos", JSON.stringify(productos));
    mostrarProductos();
  }

  function mostrarProductos() {
    listaProductos.innerHTML = "";

    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];

      const div = document.createElement("div");

      const nombre = document.createElement("strong");
      nombre.textContent = producto.nombre;

      const stock = document.createElement("p");
      stock.textContent = "Stock: " + producto.cantidad;

      const btnSumar = document.createElement("button");
      btnSumar.textContent = "+";

      const btnRestar = document.createElement("button");
      btnRestar.textContent = "-";

      btnSumar.addEventListener("click", function () {
        sumarStock(i);
      });

      btnRestar.addEventListener("click", function () {
        restarStock(i);
      });

      const btnEliminar = document.createElement("button");
      btnEliminar.textContent = "Eliminar";

      btnEliminar.addEventListener("click", function () {
        eliminarProducto(i);
      });

      div.appendChild(nombre);
      div.appendChild(stock);
      div.appendChild(btnSumar);
      div.appendChild(btnRestar);
      div.appendChild(btnEliminar);


      listaProductos.appendChild(div);
    }
  }

  function sumarStock(indice) {
    productos[indice].cantidad += 1;

    localStorage.setItem("productos", JSON.stringify(productos));
    mostrarProductos();
  }

  function restarStock(indice) {
    if (productos[indice].cantidad > 0) {
      productos[indice].cantidad -= 1;

      localStorage.setItem("productos", JSON.stringify(productos));
      mostrarProductos();
    }
  }

  function eliminarProducto(indice) {
    productos.splice(indice, 1);

    localStorage.setItem("productos", JSON.stringify(productos));
    mostrarProductos();
}



});
