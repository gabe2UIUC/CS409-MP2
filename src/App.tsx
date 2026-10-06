import { useState, useEffect } from 'react'
import './App.css'
import axios from 'axios';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useParams,
  useNavigate
} from "react-router-dom";

const pokemonTypes = [
  "Normal", 
  "Fire",
  "Water",
  "Grass",
  "Electric",
  "Ice",
  "Fighting",
  "Poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Dragon",
  "Dark",
  "Steel",
  "Fairy"
]

function App() {
  const [allPokemon, setAllPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0', {
          signal: controller.signal
        });

        const detailPromises = response.data.results.map((pokemon) =>
          axios.get(pokemon.url, { signal: controller.signal })
        );
  
        const detailResponses = await Promise.all(detailPromises);
  
        const allPokemonJson = detailResponses.map((response) => response.data);

        setAllPokemon(allPokemonJson);
        setError(null);
      } catch (err) {
        if (!axios.isCancel(err)) {
          setError(err.message || 'Loading the PokeAPI failed.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) return <p>Loading data...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <>
      <h1>National Pokédex</h1>

      <Router basename={import.meta.env.BASE_URL}>
        <div>
          <nav>
            <ul className='list-horizontally'>
              <li>
                <Link to="/search">Search</Link>
              </li>
              <li>
                <Link to="/gallery">Gallery</Link>
              </li>
            </ul>
          </nav>

          <Routes>
            <Route path="/" element={<Navigate to="/search" replace />} />
            <Route path="/search" element={<Search allPokemonJson={allPokemon} />} />
            <Route path="/gallery" element={<Gallery allPokemonJson={allPokemon} />} />
            <Route path="/details/:id" element={<Details allPokemonJson={allPokemon} />} />
          </Routes>
        </div>
      </Router>
    </>
  )
}

function Search({ allPokemonJson }) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sort, setSort] = useState('ascending')

  const filteredPokemon = allPokemonJson.filter(pokemon => 
    pokemon.name.toLowerCase().includes(query.toLowerCase())
  );
  filteredPokemon.sort((a, b) => {
    if (sortBy === 'name') {
      if (sort === 'ascending') return a.name.localeCompare(b.name);
      else return b.name.localeCompare(a.name);
    }
    else {
      if (sort === 'ascending') return a[sortBy] - b[sortBy];
      else return b[sortBy] - a[sortBy];
    }
  });

  return (
    <>
      <SearchBar query={query} setQuery={setQuery} sortBy={sortBy} setSortBy={setSortBy} sort={sort} setSort={setSort} />
      <PokemonList processedPokemonJson={filteredPokemon} />
    </>
  );
}

function SearchBar({ query, setQuery, sortBy, setSortBy, sort, setSort }) {
  const onQueryChanged = (event) => {
    setQuery(event.target.value);
  };
  const onSortByChanged = (event) => {
    setSortBy(event.target.value);
  };
  const onSortChanged = (event) => {
    setSort(event.target.value);
  };

  return (
    <form className='search-form'>
      <input type="text" placeholder='Search...' className='search-bar-item' value={query} onChange={onQueryChanged} />

      <select className='search-bar-item' value={sortBy} onChange={onSortByChanged}>
        <option value="name">Name</option>
        <option value="height">Height</option>
        <option value="weight">Weight</option>
        <option value="id">ID Number</option>
      </select>

      <label>
        <input type="radio" name="listSort" value="ascending" className='search-bar-item' checked={sort === 'ascending'} onChange={onSortChanged} />
        Ascending 
      </label>
      <label>
        <input type="radio" name="listSort" value="descending" className='search-bar-item' checked={sort === 'descending'} onChange={onSortChanged} />
        Descending  
      </label>
    </form>
  );
}

function PokemonList({ processedPokemonJson }) {
  return (
    <ul className='list-vertically' id="pokemon-list">
      {processedPokemonJson.map((pokemonJson) => (
        <PokemonListItem key={pokemonJson.id} pokemonJson={pokemonJson} />
      ))}
    </ul>
  );
}

function PokemonListItem({ pokemonJson }) {
  const navigate = useNavigate();

  const onItemClick = (pokemonId) => {
    navigate(`/details/${pokemonId}`);
  };

  return (
    <li className='pokemon-item' onClick={() => onItemClick(pokemonJson.id)}>
      <img src={pokemonJson.sprites.other.home.front_default} alt={"No image available for " + pokemonJson.name}/>
      <h2>{pokemonJson.name.charAt(0).toUpperCase() + pokemonJson.name.slice(1)}</h2>
      <p>ID Number: {pokemonJson.id}</p>
      <p>Height: {pokemonJson.height / 10} m</p>
      <p>Weight: {pokemonJson.weight / 10} kg</p>
    </li>
  );
}

function Gallery({ allPokemonJson }) {
  const [typeFilter, setTypeFilter] = useState('')
  const navigate = useNavigate();

  const onTypeClick = (type) => {
    if (typeFilter.toLowerCase() === type.toLowerCase()) {
      setTypeFilter('');
    }
    else {
      setTypeFilter(type.toLowerCase());
    }
  };
  const onImageClick = (pokemonId) => {
    navigate(`/details/${pokemonId}`);
  };

  const filteredPokemon = allPokemonJson.filter(pokemon => {
    if (typeFilter === '') return true;
    let types = pokemon.types.map((typeJson) => typeJson.type.name);
    console.log(types, typeFilter)
    return types.includes(typeFilter);
  });

  return (
    <div>
      <ul className='list-horizontally' id='type-bar'>
        {pokemonTypes.map((type) => (
          <li key={type} value={type} className={`type-selection ${typeFilter === type.toLowerCase() ? 'active' : ''}`} onClick={() => onTypeClick(type)} >
            {type}
          </li>
        ))}
      </ul>

      <div className='gallery-container'>
        <div className='gallery-grid'>
          {filteredPokemon.map((pokemonJson) => (
            <img key={pokemonJson.id} src={pokemonJson.sprites.other.home.front_default} 
            alt={"No image available for " + pokemonJson.name} onClick={() => onImageClick(pokemonJson.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Details({ allPokemonJson }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flavorText, setFlavorText] = useState('Loading flavor text...');

  const onButtonClick = (targetId) => {
    let fixed_id = (targetId < 1) ? 1 : targetId;
    fixed_id = (targetId > 10326) ? 10326 : fixed_id;
    navigate(`/details/${fixed_id}`);
  };

  const pokemonJson = allPokemonJson.find((pokemon) => pokemon.id === Number(id));

  useEffect(() => {
    const controller = new AbortController();

    const fetchSpeciesData = async () => {
      try {
        const speciesUrl = pokemonJson.species.url;
        const response = await axios.get(speciesUrl, { signal: controller.signal });

        const englishEntry = response.data.flavor_text_entries.find(
          (entry) => entry.language.name === 'en'
        );

        setFlavorText(englishEntry.flavor_text);

      } catch (err) {
        if (!axios.isCancel(err)) {
          setFlavorText('Failed to find flavor text.');
        }
      }
    };

    fetchSpeciesData();

    return () => controller.abort();
  }, [id, pokemonJson]);

  return (
    <div className='list-horizontally' id='details-card-container'>
      <button onClick={() => onButtonClick(Number(id) - 1)}>❮</button>

      <div className='list-horizontally' id='details-card'>
        <img src={pokemonJson.sprites.other.home.front_default} alt={"No image available for " + pokemonJson.name}/>
        <div className='list-vertically'>
          <div className='list-horizontally' id='standard-info'>
            <h2>{pokemonJson.name.charAt(0).toUpperCase() + pokemonJson.name.slice(1)}</h2>
            <p>ID Number: {pokemonJson.id}</p>
            <p>Height: {pokemonJson.height / 10} m</p>
            <p>Weight: {pokemonJson.weight / 10} kg</p>
          </div>
          <div className='list-horizontally' id='type-abilities'>
            <ul>
              <li><h4>Type:</h4></li>
              {pokemonJson.types.map((type_wrapper) => (
                <li>{type_wrapper.type.name}</li>
              ))}
            </ul>
            <ul>
              <li><h4>Abilities:</h4></li>
              {pokemonJson.abilities.map((ability_wrapper) => (
                <li>{ability_wrapper.ability.name}</li>
              ))}
            </ul>
          </div>
          {<p>{flavorText}</p>}
        </div>
      </div>

      <button onClick={() => onButtonClick(Number(id) + 1)}>❯</button>
    </div>
  );
}

export default App
