// variables

var EVENTS = {
  FILTERS: {
    CHANGED: 'filters-changes',
  },
  PRODUCTS: {
    ITEM_ACTIVATED: 'product-activated',
  },
};
// filters

function Filter(bus, filtersEl) {
    this.get = getFilters;
    this.reset = resetFilters;

    var filters = {};
    // get all filter inputs
    var inputs = filtersEl.querySelectorAll('input[data-filter-value]');
    // create summary filters object with group name, filter name and value from DOM
    Array.prototype.forEach.call(inputs, function(input) {
        var filterGroup = input.closest('[data-filter-name]').dataset.filterName;
        var filterValue = input.dataset.filterValue;
        if (!filters.hasOwnProperty(filterGroup)) {
            filters[filterGroup] = {};
        }
        filters[filterGroup][filterValue] = {
            state: input.checked,
            el: input
        };
    });

    // return only active filters
    function getFilters() {
        var groupKeys = Object.keys(filters);
        var result = {};
        groupKeys.forEach(function(groupKey) {
            var itemKeys = Object.keys(filters[groupKey]);
            itemKeys.forEach(function(itemKey) {
                if (filters[groupKey][itemKey].state === true) {
                    if (!result.hasOwnProperty(groupKey)) {
                        result[groupKey] = [];
                    }
                    result[groupKey].push(itemKey);
                }
            });
        });
        return result;
    }

    // update filters summary on filter input change
    filtersEl.addEventListener('change', function(e) {
        var target = e.target;
        if (target.dataset.filterValue) {
            var filterGroup = target.closest('[data-filter-name]').dataset.filterName;
            var filterValue = target.dataset.filterValue;
            var filterAutoSelect = target.closest('[data-filter-auto-select]')
                ? target.closest('[data-filter-auto-select]').dataset.filterAutoSelect
                : null;
            if (filterAutoSelect && target.checked) {
                autoSelect(filterGroup, filterValue);
            }
            filters[filterGroup][filterValue].state = target.checked;
            bus.emitEvent(EVENTS.FILTERS.CHANGED, [getFilters()]);
        }
    });

    // preselect previous inputs
    function autoSelect(filterGroup, filterValue) {
        var groupKeys = Object.keys(filters[filterGroup]);
        var currentIndex = groupKeys.indexOf(filterValue);
        for (var i = 0; i < currentIndex; i++) {
            filters[filterGroup][groupKeys[i]].el.checked = true;
            filters[filterGroup][groupKeys[i]].state = true;
        }
        autoSelectionPending = false;
    }

    // reset all filters
    function resetFilters() {
        if (!Object.keys(getFilters()).length) {
            return;
        }
        var groupKeys = Object.keys(filters);
        groupKeys.forEach(function(groupKey) {
            var itemKeys = Object.keys(filters[groupKey]);
            itemKeys.forEach(function(itemKey) {
                filters[groupKey][itemKey].el.checked = false;
                filters[groupKey][itemKey].state = false;
            });
        });
        bus.emitEvent(EVENTS.FILTERS.CHANGED, [getFilters()]);
    }

}
// product grid

function ProductGrid(bus, productGridEl, productGridTitle, products) {
  var grid = null;

  var templates = {
    gridItem: '<div class="item" data-category=":CATEGORY" data-size=":SIZE" data-group=":GROUP" data-price=":PRICE" data-index=":INDEX">' +
                '<div class="item-content">' +
                  '<div class="product-detail__grid__item__wrapper">' +
                    '<div class="product-detail__grid__item">' +
                      '<img src=":SRC" class="product-detail__grid__item__img">' +
                      '<p class="product-detail__grid__item__price">:PRICE</p>' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>',
    gridTitle: 'Filtered Results :FILTERED <span class="product-detail__grid__title--small">(of :TOTAL items in total)</span>',
  }

  this.init = function() {
    renderGridItems();
    sortByPrice();
    renderGridTitle();
    if (grid) {
      activateItem(grid.getItems()[0].getElement().dataset.index);
    }
    productGridEl.addEventListener('click', function(e) {
      var target = e.target;
      var index = null;
      if (target.dataset.index) {
        index = target.dataset.index;
      }
      if (target.closest('[data-index]')) {
        index = target.closest('[data-index]').dataset.index;
      }
      if (index) {
        activateItem(index);
      }
    });
  }

  this.filterBy = function(filterData) {
    filterGrid(filterData);
    renderGridTitle();
  }

  function renderGridItems() {
    products.forEach(function(product, index) {
      productGridEl.insertAdjacentHTML('beforeend', templates.gridItem
        .replace(':SRC', product.image_url)
        .replace(':PRICE', product.price)
        .replace(':CATEGORY', product.category.join('|||'))
        .replace(':SIZE', product.size)
        .replace(':PRICE', '$' + (product.price / 100))
        .replace(':INDEX', index)
        .replace(':GROUP', product.group));
    });
    grid = new Muuri(productGridEl);
  }

  function renderGridTitle() {
    var total = grid
      ? grid.getItems().length
      : products.length;
    var filtered = grid
      ? grid.getItems().filter(function (item) {
        return item.isActive();
      }).length
      : products.length;
    productGridTitle.innerHTML = templates.gridTitle
      .replace(':TOTAL', total)
      .replace(':FILTERED', filtered);
  }

  function filterGrid(filterData) {
    if (grid) {
      grid.filter(function (item) {
        var itemEl = item.getElement();
        var itemProps = {
          price: [itemEl.dataset.price],
          size: [itemEl.dataset.size],
          category: itemEl.dataset.category.split('|||'),
        };
        var filterKeys = Object.keys(filterData);
        if (!filterKeys.length) {
          return true;
        }
        var matchScheme = {};
        var isMatch = false;
        filterKeys.forEach(function(key) {
          if (itemProps.hasOwnProperty(key)) {
            isMatch = false;
            filterData[key].forEach(function(filterDataVal) {
              if (key === 'price') {
                var priceRange = filterDataVal.split('-');
                var itemPrice = +itemProps[key] / 100;
                var min = priceRange[0] === "" ? itemPrice : +priceRange[0];
                var max = priceRange[1] === "" ? itemPrice : +priceRange[1];
                if (itemPrice >= min && itemPrice <= max) {
                  isMatch = true;
                }
              } else {
                if (itemProps[key].indexOf(filterDataVal) !== -1) {
                  isMatch = true;
                }
              }
            });
            matchScheme[key] = isMatch;
          }
        });
        var matchSchemeKeys = Object.keys(matchScheme);
        return matchSchemeKeys.reduce(function(accumulator, nextKey) {
          return accumulator && matchScheme[nextKey];
        }, matchScheme[matchSchemeKeys[0]]);
      });
    }
  }

  function sortByPrice() {
    if (grid) {
      grid.sort(function (itemA, itemB) {
        var aPrice = parseInt(itemA.getElement().dataset.price);
        var bPrice = parseInt(itemB.getElement().dataset.price);
        return aPrice - bPrice;
      });
    }
  }

  function activateItem(index) {
    var item = productGridEl.querySelector('[data-index="' + index + '"] .product-detail__grid__item');
    deactivateItems();
    item.classList.add('product-detail__grid__item--active');
    bus.emitEvent(EVENTS.PRODUCTS.ITEM_ACTIVATED, [products[index]]);
  }

  function deactivateItems() {
    var items = productGridEl.querySelectorAll('.product-detail__grid__item');
    Array.prototype.forEach.call(items, function(item) {
      item.classList.remove('product-detail__grid__item--active');
    })
  }
}

// product preview

function ProductPreview(bus, productPreviewEl) {
  var template = '';
  function renderPreview(product) {

  }
}
// script

var bus = new EventEmitter();

var filter = new Filter(bus, document.getElementById('filters'));
var productGrid = new ProductGrid(
    bus,
    document.getElementById('product-grid'),
    document.getElementById('product-grid-title'),
    products
);
productGrid.init();

bus.addListener(EVENTS.FILTERS.CHANGED, function(data) {
    productGrid.filterBy(data);
});