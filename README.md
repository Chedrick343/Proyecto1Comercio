# Laboratorio-2-Comercio-electronico

# 1. Decisiones de Diseño (UI)
La decisión de usar colores grises viene de que se quería una paleta de colores elegante.
Estos colores generan un gran contraste con estos accesorios ya que en su mayoría son coloridos y los tonos que usamos realzan esos colores.


# 2. Experiencia de usuario (UX).
Se ubicaron los filtros en un menú desplegable, para no sobrecargar la interfaz y si el usuario necesita aplicarlos entonces presiona y se despliegan los filtros.
Como hay muchas categorías, decidimos colocar dentro de un div las categorías que el usuario puede marcar pero le pusimos un scrollbar para no hacer una lista gigantesca y el siguiente filtro que es el de los precios estuviera escondido hasta abajo.
Para el rango de precios restringimos que la cantidad mínima no puediera ser mayor que la cantidad máxima, por ende tampoco podía pasar lo contrario. Elegimos una barra deslizante azul que eleva los precios de 10 mil en 10 mil hasta donde el usuario quiere.

Para paginar decidimos colocar 10 productos por página, nos parece una cantidad suficiente para no tener un scroll infinito.

La barra de búsqueda la hicimos como normalmente se ve en las aplicaciones, una barra blanca con bordes redondeados donde se le pregunta al usuario si busca algo en específico y justo al lado un botón de buscar lo suficientemente grande para que el usuario lo identifique.


# 3. Manejo de estados.
Cuando no se arroja ningún estado se le indica al usuario que no hay productos que coincidan con lo que buscó y se le da una sugerencia de que pruebe cambiar los filtros.

# Uso de la inteligencia artificial

Para desarrollar productsGrid.tsx nos apoyamos de la IA para poder generar el componente.
Bajo supervisión le dimos el siguiente prompt a la IA:

"Eres un desarrollador web, usando react + typescript que repliques la siguiente interfaz gráfica creada con figma
alimentadote de un archivo .json que se encuentra en la siguiente ruta ../Data/products(1).json para generar la cuadricula 
de productos.
"

De esa forma se consiguió la cuadricula. El json fue utilizado para simular la conexión con algolia

# Enlace del repositorio desplegado
https://chedrick343.github.io/Proyecto1Comercio/
