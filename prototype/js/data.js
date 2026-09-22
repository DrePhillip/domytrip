/* DoMyTrip — dados mock. Sem lógica aqui (CLAUDE.md §4).
   As coordenadas `xy` são coordenadas do canvas do mapa (0–1200), não lat/lon. Ver ADR-004. */

/* ---------- Ícones ----------
   Desenhados em traço sobre uma grelha de 24, com pontas e juntas redondas.
   Um ponto faz-se com um segmento de comprimento zero (`h.01`) — a ponta
   redonda transforma-o num círculo perfeito.
   Os nomes em FILLED são desenhados a preenchimento em vez de traço.       */
const ICONS = {
  /* categorias */
  museus: 'M3 9.8 12 4.4l9 5.4M5.3 10.6v7.6M9.8 10.6v7.6M14.2 10.6v7.6M18.7 10.6v7.6M3.4 20.9h17.2',
  arte: 'M12 3.2a8.8 8.8 0 1 0 0 17.6 2.1 2.1 0 0 0 1.6-3.5 2.1 2.1 0 0 1 1.6-3.5h1.6a4 4 0 0 0 4-4c0-3.7-3.9-6.6-8.8-6.6ZM7.8 8.4h.01M6.9 12.9h.01M11.6 6.9h.01M15.9 9.1h.01',
  historia: 'M4.2 20.9h15.6M6.4 20.9V9.8m11.2 11.1V9.8M6.4 9.8a5.6 5.6 0 0 1 11.2 0M9.6 20.9v-5.6a2.4 2.4 0 0 1 4.8 0v5.6',
  comida: 'M7 3.2v6.4a2.6 2.6 0 0 0 5.2 0V3.2M9.6 9.9v10.9M17.4 3.2c-1.4 1.7-2.1 3.6-2.1 5.8 0 1.7.8 2.9 2.1 3.4v8.4',
  cafes: 'M4.2 5.4h11.4v4.9a5.7 5.7 0 0 1-11.4 0V5.4ZM15.6 7h1.6a2.6 2.6 0 0 1 0 5.2h-1.6M3.2 20.4h13.4',
  noturna: 'M3.4 4h17.2l-8.6 9.3v6.6M8.6 19.9h6.8',
  natureza: 'M12 3.4 7.4 11h2.9l-4 6.6h11.4l-4-6.6h2.9L12 3.4ZM12 17.6v3.2',
  compras: 'M6.2 8h11.6l1.1 12.8H5.1L6.2 8ZM9.1 8V6.2a2.9 2.9 0 0 1 5.8 0V8',
  fotografia: 'M4.4 7.6h3.3L9.1 5h5.8l1.4 2.6h3.3a1.6 1.6 0 0 1 1.6 1.6v9.2a1.6 1.6 0 0 1-1.6 1.6H4.4a1.6 1.6 0 0 1-1.6-1.6V9.2a1.6 1.6 0 0 1 1.6-1.6ZM12 9.9a3.9 3.9 0 1 1 0 7.8 3.9 3.9 0 0 1 0-7.8Z',
  musica: 'M9.2 17.6V6.1l10.4-2.2v11.5M9.2 17.6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM19.6 15.4a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  arquitetura: 'M3.2 20.9V9.2l5.9-3.9 5.9 3.9v11.7M14.9 12.4h5.9v8.5M2.6 20.9h18.8M6.4 12.1h1.9M6.4 16.1h1.9M10.6 12.1h1.9M10.6 16.1h1.9M17.2 15.6h1.3',
  mercados: 'M2.9 8.9h18.2l-1.7 11.9H4.6L2.9 8.9ZM8.4 3.2l2.1 5.4M15.6 3.2l-2.1 5.4',
  vinhos: 'M7 3.4h10c0 4.6-2.2 7.6-5 8.2v8.8M8.6 20.4h6.8M7 3.4c0 4.6 2.2 7.6 5 8.2',
  bemestar: 'M20.6 3.4C11.2 3.4 4.6 8.4 4.6 15.4c0 1.7.4 3.2 1.2 4.4 7.4.6 14.8-5.9 14.8-16.4ZM6.2 19.6C9 14.2 13.4 9.7 18 7.2',

  /* interface */
  back: 'M19 12H5M11 6l-6 6 6 6',
  chevron: 'M9.5 6l6 6-6 6',
  search: 'M11 4.2a6.8 6.8 0 1 1 0 13.6 6.8 6.8 0 0 1 0-13.6ZM20 19.8l-4.2-4.2',
  crosshair: 'M12 2.6v3.1M12 18.3v3.1M2.6 12h3.1M18.3 12h3.1M12 6.6a5.4 5.4 0 1 1 0 10.8 5.4 5.4 0 0 1 0-10.8ZM12 11.9h.01',
  walk: 'M13.6 4.4a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4ZM11 22l1.3-6-2.6-2.4 1-4.9 3.4-1 2.3 3.6 2.9 1.1M12.4 16 8.6 22M9.7 8.7l-3.2 1.8-.9 3.6',
  metro: 'M6.4 3.2h11.2a2.2 2.2 0 0 1 2.2 2.2v8.9a3 3 0 0 1-3 3H7.2a3 3 0 0 1-3-3V5.4a2.2 2.2 0 0 1 2.2-2.2ZM4.2 10.2h15.6M8.2 13.9h.01M15.8 13.9h.01M8.4 17.3 6.2 21.2M15.6 17.3l2.2 3.9',
  clock: 'M12 3.1a8.9 8.9 0 1 1 0 17.8 8.9 8.9 0 0 1 0-17.8ZM12 7.1v5.2l3.3 2',
  check: 'M4.8 12.6 9.6 17.4 19.2 6.8',
  close: 'M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6',
  plus: 'M12 5.2v13.6M5.2 12h13.6',
  minus: 'M5.2 12h13.6',
  group: 'M9.2 4.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2ZM2.6 20.3c0-3.2 2.9-5.4 6.6-5.4s6.6 2.2 6.6 5.4M16.2 6.2a3 3 0 0 1 0 5.7M17.9 15.3c2.2.7 3.5 2.2 3.5 4.3',
  receipt: 'M5.2 3.2h13.6v17.9l-2.3-1.5-2.3 1.5-2.3-1.5-2.3 1.5-2.3-1.5-2.1 1.5V3.2ZM9 8.4h6M9 12.2h6M9 16h3.4',
  pin: 'M12 21.4s7.2-6.6 7.2-11.4a7.2 7.2 0 1 0-14.4 0c0 4.8 7.2 11.4 7.2 11.4ZM12 7.6a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8Z',
  person: 'M12 3.8a4.1 4.1 0 1 1 0 8.2 4.1 4.1 0 0 1 0-8.2ZM4.2 20.8c0-3.6 3.5-5.9 7.8-5.9s7.8 2.3 7.8 5.9',
  route: 'M6.2 3.9a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2ZM17.8 14.9a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2ZM6.2 9.1v3.8a4.6 4.6 0 0 0 4.6 4.6h7',
  spark: 'M12 3.4 13.7 8.3 18.6 10 13.7 11.7 12 16.6 10.3 11.7 5.4 10 10.3 8.3 12 3.4ZM18.4 15.4l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z',
  euro: 'M18.6 6.4a5.7 5.7 0 0 0-3.9-1.6c-3.5 0-5.9 2.7-6.4 6.5-.1.7-.1 1.4 0 2.1.5 3.8 2.9 6.5 6.4 6.5a5.7 5.7 0 0 0 3.9-1.6M5.4 10.1h8.2M5.4 13.7h8.2',
  pace: 'M12 3.1a8.9 8.9 0 1 1 0 17.8 8.9 8.9 0 0 1 0-17.8ZM12 12l4.2-3.7M12 11.9h.01',
  shield: 'M12 3 19 6v5.4c0 4.3-2.9 7.8-7 9.1-4.1-1.3-7-4.8-7-9.1V6l7-3Z',
  sliders: 'M4 7.4h9.2M17.2 7.4h2.8M4 16.6h3.6M11.6 16.6h8.4M15.2 4.4v6M9.6 13.6v6',
  layers: 'M12 3.4 21 8l-9 4.6L3 8l9-4.6ZM3 13.1 12 17.7l9-4.6M3 17.6 12 22.2l9-4.6',

  /* preenchidos */
  star: 'M12 2.8 14.9 8.7l6.5 1-4.7 4.6 1.1 6.5L12 17.7l-5.8 3.1 1.1-6.5L2.6 9.7l6.5-1 2.9-5.9Z',
};

/* Ícones desenhados a preenchimento em vez de traço. */
const FILLED = new Set(['star']);

/* ---------- Utilizador ---------- */
const USER = {
  nome: 'André',
  iniciais: 'A',
  cidade: 'Roma',
  bairro: 'Centro Storico',
  chegada: 'Chegaste hoje',
};

/* ---------- Cidades (passo 1 do onboarding) ---------- */
const CITIES = [
  { id: 'roma', nome: 'Roma', sub: 'Detetada pela tua chegada de hoje', ico: 'pin' },
  { id: 'outra', nome: 'Outra cidade', sub: 'Procurar manualmente', ico: 'search' },
];

/* ---------- Interesses do onboarding ---------- */
const INTERESTS = [
  { id: 'museus', label: 'Museus' },
  { id: 'historia', label: 'História' },
  { id: 'arte', label: 'Arte' },
  { id: 'comida', label: 'Comida' },
  { id: 'cafes', label: 'Cafés' },
  { id: 'vinhos', label: 'Vinhos' },
  { id: 'arquitetura', label: 'Arquitetura' },
  { id: 'natureza', label: 'Natureza' },
  { id: 'mercados', label: 'Mercados' },
  { id: 'fotografia', label: 'Fotografia' },
  { id: 'musica', label: 'Música' },
  { id: 'noturna', label: 'Noite' },
  { id: 'compras', label: 'Compras' },
  { id: 'bemestar', label: 'Bem-estar' },
];

const CAT_LABEL = Object.fromEntries(INTERESTS.map(i => [i.id, i.label]));

/* ---------- Ritmo ---------- */
const PACES = [
  { id: 'relaxado', label: 'Relaxado', desc: '3 paragens, com tempo para café', stops: 3, icon: 'cafes' },
  { id: 'equilibrado', label: 'Equilibrado', desc: '5 paragens, o dia cheio', stops: 5, icon: 'pace' },
  { id: 'intenso', label: 'Intenso', desc: '6 ou mais, sem paragens longas', stops: 6, icon: 'walk' },
];

/* ---------- Orçamento ---------- */
const BUDGETS = [
  { id: 'baixo', label: 'Apertado', desc: 'Prioriza gratuito e barato', max: 12 },
  { id: 'medio', label: 'Normal', desc: 'Entradas e uma refeição fora', max: 30 },
  { id: 'alto', label: 'Sem limite', desc: 'Mostra-me o melhor que há', max: 999 },
];

/* ---------- Pontos de interesse (Roma) ----------
   walk      = minutos a pé a partir da posição atual
   dur       = duração típica da visita, em minutos
   preco     = euros por pessoa
   abre/fecha= horário (24h)
   destaques = o que não se pode perder lá dentro
   dica      = a coisa que só se sabe depois de lá ter ido                   */
const POIS = [
  {
    id: 'capitolini', nome: 'Museus Capitolinos', cat: 'museus', xy: [556, 552],
    sub: 'A coleção pública mais antiga do mundo, aberta desde 1734',
    walk: 6, dur: 90, preco: 16, abre: '09:30', fecha: '19:30', rating: 4.7,
    morada: 'Piazza del Campidoglio 1',
    destaques: ['A Loba Capitolina', 'O colosso de Constantino no pátio', 'A vista da Tabularium sobre o Fórum'],
    dica: 'A galeria da Tabularium está incluída no bilhete e quase ninguém lá vai. É a melhor vista sobre o Fórum.',
  },
  {
    id: 'panteao', nome: 'Panteão', cat: 'historia', xy: [608, 500],
    sub: 'Cúpula de betão sem armadura, ainda hoje a maior do mundo',
    walk: 4, dur: 40, preco: 5, abre: '09:00', fecha: '19:00', rating: 4.9,
    morada: 'Piazza della Rotonda',
    destaques: ['O óculo de 9 metros', 'O túmulo de Rafael', 'O pavimento original em mármore'],
    dica: 'Vai antes das 10:30. A partir daí a fila dá a volta à praça toda.',
  },
  {
    id: 'doria', nome: 'Palazzo Doria Pamphilj', cat: 'arte', xy: [582, 516],
    sub: 'Galeria privada de uma família que ainda lá vive',
    walk: 5, dur: 75, preco: 14, abre: '09:00', fecha: '19:00', rating: 4.6,
    morada: 'Via del Corso 305',
    destaques: ['O Inocêncio X de Velázquez', 'A Galeria dos Espelhos', 'Os aposentos privados'],
    dica: 'O audioguia é narrado pelo próprio príncipe da família. Vale mais do que metade dos quadros.',
  },
  {
    id: 'eustachio', nome: 'Caffè Sant Eustachio', cat: 'cafes', xy: [578, 530],
    sub: 'O expresso de referência da cidade desde 1938',
    walk: 5, dur: 20, preco: 4, abre: '07:30', fecha: '21:00', rating: 4.5,
    morada: 'Piazza di Sant Eustachio 82',
    destaques: ['O gran caffè batido', 'O balcão de mármore original'],
    dica: 'Vem açucarado por defeito. Pede "senza zucchero" se não o quiseres doce.',
  },
  {
    id: 'campofiori', nome: 'Campo de Fiori', cat: 'mercados', xy: [534, 568],
    sub: 'Mercado de manhã, praça de esplanadas à noite',
    walk: 8, dur: 35, preco: 0, abre: '07:00', fecha: '14:00', rating: 4.3,
    morada: 'Campo de Fiori',
    destaques: ['Bancas de especiarias e massa seca', 'A estátua de Giordano Bruno', 'O Forno, na esquina'],
    dica: 'O mercado desmonta ao meio-dia em ponto. Depois disso já só há esplanadas.',
  },
  {
    id: 'foro', nome: 'Fórum Romano', cat: 'historia', xy: [634, 630],
    sub: 'O centro político do império, a céu aberto',
    walk: 11, dur: 100, preco: 18, abre: '09:00', fecha: '18:30', rating: 4.8,
    morada: 'Via della Salara Vecchia 5',
    destaques: ['A Via Sacra', 'O Arco de Tito', 'A Casa das Vestais'],
    dica: 'Entra pelo lado do Palatino: a fila é metade e desces para o Fórum em vez de subires.',
  },
  {
    id: 'coliseu', nome: 'Coliseu', cat: 'historia', xy: [720, 678],
    sub: 'Cinquenta mil lugares, construído em oito anos',
    walk: 17, dur: 90, preco: 18, abre: '09:00', fecha: '18:30', rating: 4.9,
    morada: 'Piazza del Colosseo 1',
    destaques: ['A arena subterrânea', 'O segundo piso', 'O Arco de Constantino à saída'],
    dica: 'O bilhete inclui o Fórum e o Palatino e é válido 24 horas. Não precisas de fazer tudo hoje.',
  },
  {
    id: 'clemente', nome: 'Basílica de San Clemente', cat: 'historia', xy: [764, 640],
    sub: 'Três cidades empilhadas, uma por cada mil anos',
    walk: 20, dur: 55, preco: 10, abre: '10:00', fecha: '18:00', rating: 4.7,
    morada: 'Via Labicana 95',
    destaques: ['A basílica do século XII', 'A igreja do século IV por baixo', 'O templo de Mitra no fundo'],
    dica: 'Leva casaco. O nível mais fundo está a 16 graus todo o ano e ouve-se um rio a correr.',
  },
  {
    id: 'borghese', nome: 'Galeria Borghese', cat: 'arte', xy: [706, 372],
    sub: 'Bernini e Caravaggio na mesma sala',
    walk: 24, dur: 120, preco: 22, abre: '09:00', fecha: '19:00', rating: 4.9,
    morada: 'Piazzale Scipione Borghese 5',
    destaques: ['O Rapto de Prosérpina', 'Apolo e Dafne', 'O Rapaz com Cesto de Frutas'],
    dica: 'Entrada por marcação em blocos de duas horas. Sem reserva não entras, mesmo com a sala vazia.',
  },
  {
    id: 'villa', nome: 'Villa Borghese', cat: 'natureza', xy: [652, 396],
    sub: 'Oitenta hectares de parque acima do centro',
    walk: 21, dur: 60, preco: 0, abre: '07:00', fecha: '21:00', rating: 4.6,
    morada: 'Piazzale Napoleone I',
    destaques: ['O terraço do Pincio', 'O lago com o templo de Esculápio', 'Bicicletas à entrada'],
    dica: 'O Pincio ao fim da tarde tem a melhor vista sobre a Piazza del Popolo, e é de graça.',
  },
  {
    id: 'vaticano', nome: 'Museus do Vaticano', cat: 'museus', xy: [372, 466],
    sub: 'Sete quilómetros de salas até à Capela Sistina',
    walk: 34, dur: 180, preco: 20, abre: '08:00', fecha: '18:00', rating: 4.8,
    morada: 'Viale Vaticano',
    destaques: ['A Capela Sistina', 'Os Quartos de Rafael', 'A escadaria helicoidal'],
    dica: 'A última entrada da tarde é a menos cheia. De manhã é uma fila só, do início ao fim.',
  },
  {
    id: 'montemartini', nome: 'Centrale Montemartini', cat: 'museus', xy: [520, 838],
    sub: 'Estátuas clássicas dentro de uma central elétrica',
    walk: 29, dur: 70, preco: 10, abre: '09:00', fecha: '19:00', rating: 4.8,
    morada: 'Via Ostiense 106',
    destaques: ['Mármores entre turbinas a diesel', 'A sala das caldeiras', 'Os mosaicos dos Horti'],
    dica: 'Quase sempre vazio. É o único museu de Roma onde se consegue estar sozinho com as peças.',
  },
  {
    id: 'maxxi', nome: 'MAXXI', cat: 'arte', xy: [486, 258],
    sub: 'Arte contemporânea num edifício da Zaha Hadid',
    walk: 32, dur: 80, preco: 12, abre: '11:00', fecha: '19:00', rating: 4.4,
    morada: 'Via Guido Reni 4A',
    destaques: ['As escadas suspensas', 'A galeria curva do piso 3', 'O pátio exterior'],
    dica: 'O edifício vale a visita mesmo que a exposição não te diga nada.',
  },
  {
    id: 'trastevere', nome: 'Comer em Trastevere', cat: 'comida', xy: [470, 668],
    sub: 'Cacio e pepe nas ruas estreitas da outra margem',
    walk: 18, dur: 90, preco: 26, abre: '12:00', fecha: '23:30', rating: 4.6,
    morada: 'Vicolo del Cinque',
    destaques: ['Cacio e pepe', 'Carciofi alla giudia', 'Vinho da casa a copo'],
    dica: 'Atravessa a Ponte Sisto a pé. As casas boas são as que não têm ementa em inglês à porta.',
  },
  {
    id: 'testaccio', nome: 'Mercato di Testaccio', cat: 'mercados', xy: [498, 782],
    sub: 'O mercado onde os romanos almoçam a sério',
    walk: 27, dur: 50, preco: 12, abre: '07:00', fecha: '15:30', rating: 4.5,
    morada: 'Via Beniamino Franklin',
    destaques: ['Panino con allesso', 'Trapizzino', 'Bancas de queijo e enchidos'],
    dica: 'Banca 15, o panino com allesso. Chega antes das 13:00 ou apanhas fila.',
  },
  {
    id: 'jazz', nome: 'Alexanderplatz Jazz Club', cat: 'musica', xy: [432, 428],
    sub: 'O clube de jazz mais antigo de Itália',
    walk: 25, dur: 120, preco: 15, abre: '21:00', fecha: '01:30', rating: 4.5,
    morada: 'Via Ostia 9',
    destaques: ['Concertos todas as noites', 'Paredes assinadas por músicos', 'Cozinha aberta até tarde'],
    dica: 'Precisa de cartão de sócio. Faz-se à porta em dois minutos e dá para o ano todo.',
  },
];

/* ---------- Hangouts ---------- */
const HANGOUTS = [
  { id: 'h1', titulo: 'Maratona de museus no Capitolino', local: 'Museus Capitolinos', hora: '10:30', pessoas: 4, max: 6, iniciais: ['M', 'L', 'S'], tag: 'museus' },
  { id: 'h2', titulo: 'Aperitivo em Trastevere', local: 'Piazza Trilussa', hora: '19:00', pessoas: 7, max: 10, iniciais: ['J', 'P', 'A'], tag: 'comida' },
  { id: 'h3', titulo: 'Passeio fotográfico ao pôr do sol', local: 'Giardino degli Aranci', hora: '18:15', pessoas: 3, max: 8, iniciais: ['R', 'T'], tag: 'fotografia' },
  { id: 'h4', titulo: 'Jazz à meia-noite', local: 'Alexanderplatz', hora: '22:30', pessoas: 5, max: 6, iniciais: ['D', 'C', 'N'], tag: 'musica' },
];

/* ---------- Posição atual no canvas do mapa ---------- */
const USER_XY = [600, 596];

/* ---------- Bairros e ruas desenhados no mapa ---------- */
const HOODS = [
  { nome: 'CENTRO STORICO', xy: [596, 470] },
  { nome: 'TRASTEVERE', xy: [438, 700] },
  { nome: 'MONTI', xy: [700, 600] },
  { nome: 'PRATI', xy: [400, 380] },
  { nome: 'TESTACCIO', xy: [498, 830] },
  { nome: 'ESQUILINO', xy: [806, 540] },
];

const STREETS = [
  { nome: 'Via del Corso', xy: [590, 420], rot: 0 },
  { nome: 'Via Nazionale', xy: [716, 546], rot: 0 },
  { nome: 'Lungotevere', xy: [500, 612], rot: -34 },
  { nome: 'Via Cavour', xy: [700, 654], rot: 0 },
  { nome: 'Via Veneto', xy: [742, 462], rot: 0 },
  { nome: 'Viale Trastevere', xy: [452, 762], rot: 0 },
];
