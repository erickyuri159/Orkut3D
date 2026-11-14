import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "orb2088";

type SeedUser = {
  username: string;
  name: string;
  headline: string;
  quote: string;
  city: string;
  state: string;
  hobbies: string;
  job: string;
  music: string;
  views: number;
  gender?: string;
  relationship?: string;
};

const USERS: SeedUser[] = [
  {
    username: "erick",
    name: "Erick Barros",
    headline: "Construindo redes sociais em 3D antes do café",
    quote: "O futuro chegou, mas em WebGL.",
    city: "São Paulo",
    state: "SP",
    hobbies: "shaders, sintetizadores, xadrez 3D, caminhadas noturnas",
    job: "Engenheiro de software",
    music: "Vaporwave, synthwave, breakcore",
    views: 4210,
  },
  {
    username: "anabaena",
    name: "Ana Baena",
    headline: "Fotógrafo de luz neon",
    quote: "Toda cidade tem uma cor que ainda não foi renderizada.",
    city: "Recife",
    state: "PE",
    hobbies: "fotografia analógica, ruído, trilhas",
    job: "Designer",
    music: "Dream pop, shoegaze",
    views: 3890,
    gender: "Feminino",
    relationship: "Solteiro(a)",
  },
  {
    username: "mcurti",
    name: "Marina Curtis",
    headline: "Escrevo sobre cosas que quebram",
    quote: "Se funcionou de primeira, não era para funcionar.",
    city: "Belo Horizonte",
    state: "MG",
    hobbies: "hacking, café, typografia",
    job: "Pesquisadora",
    music: "Glitch, IDM",
    views: 3410,
    gender: "Feminino",
  },
  {
    username: "juninho_p",
    name: "Juninho Pereira",
    headline: "Godzilla do scrapbook",
    quote: "Deixo recado em perfil alheio desde 2004 (mentira).",
    city: "Curitiba",
    state: "PR",
    hobbies: "kawaii, lolcats, tier list",
    job: "Designer",
    music: "J-pop, city pop",
    views: 3180,
  },
  {
    username: "tadeu_88",
    name: "Tadeu Nogueira",
    headline: "Cultivo nostalgia em alta definição",
    quote: "Se tem tabela com borda, é porque é clássico.",
    city: "Porto Alegre",
    state: "RS",
    hobbies: "mod, retorna 35mm, BBS",
    job: "Engenheiro",
    music: "Chiptune, dub",
    views: 2950,
  },
  {
    username: "lara_v",
    name: "Lara Vasconcelos",
    headline: "Ilustro coisas que nao existem",
    quote: "Tudo é um polígono com boa iluminação.",
    city: "Salvador",
    state: "BA",
    hobbies: "ilustração 3D, cerâmica, cozinha",
    job: "Ilustradora",
    music: "Afrobeat, ambient",
    views: 2760,
    gender: "Feminino",
  },
  {
    username: "rafa_tek",
    name: "Rafael Technotronic",
    headline: "Só subo servidor se tiver LED",
    quote: "RGB é um estilo de vida.",
    city: "Manaus",
    state: "AM",
    hobbies: "hardware, linux, overclock",
    job: "Técnico",
    music: "Techno, industrial",
    views: 2540,
  },
  {
    username: "bia_cos",
    name: "Beatriz Costa",
    headline: "Colecionadora de comunidades",
    quote: "Já entrei em 400 fóruns. Nenhum dura para sempre.",
    city: "Fortaleza",
    state: "CE",
    hobbies: "leitura, cybercafés, zines",
    job: "Jornalista",
    music: "MPB, lo-fi",
    views: 2380,
    gender: "Feminino",
    relationship: "Namorando",
  },
  {
    username: "guto_fps",
    name: "Gustavo Ferreira",
    headline: "Quero 500 fps por nada",
    quote: "Ray tracing or riot.",
    city: "Goiânia",
    state: "GO",
    hobbies: "FPS, stream, hardware antigo",
    job: "Analista",
    music: "Phonk",
    views: 2210,
  },
  {
    username: "nina_pm",
    name: "Nina Prado",
    headline: "Escrevo CSS até de madrugada",
    quote: "Borrão, né? Bora. Glow nenhum. Bora.",
    city: "Vitória",
    state: "ES",
    hobbies: "CSS, tipografia, caminhadas",
    job: "Front-end",
    music: "Lo-fi, house",
    views: 2100,
    gender: "Feminino",
  },
  {
    username: "duda_s",
    name: "Eduarda Santos",
    headline: "Fotografo tormentas",
    quote: "Relâmpago é fotografia com pressa.",
    city: "Natal",
    state: "RN",
    hobbies: "tempestade, astrofotografia, drift",
    job: "Fotógrafa",
    music: "Post-rock",
    views: 1950,
    gender: "Feminino",
  },
  {
    username: "otavio_m",
    name: "Otávio Matos",
    headline: "Compilador enthusiast",
    quote: "`undefined is not a function` — meu mantra.",
    city: "Brasília",
    state: "DF",
    hobbies: "compiladores, Rust, gaming",
    job: "Pesquisador",
    music: "Math rock",
    views: 1800,
  },
  {
    username: "carla_v",
    name: "Carla Vieira",
    headline: "Modo escuro não é opcional",
    quote: "Meu tema tem 14 níveis de preto.",
    city: "CAMPinas",
    state: "SP",
    hobbies: "UI, coffee, boardgames",
    job: "Product designer",
    music: "Nu jazz",
    views: 1700,
    gender: "Feminino",
  },
  {
    username: "zed_k",
    name: "Zé Klinger",
    headline: "Nerd assume",
    quote: "Meu profile picture é um poliedro regular.",
    city: "Joinville",
    state: "SC",
    hobbies: "geometria, xadrez, electron",
    job: "Professor",
    music: "8-bit",
    views: 1600,
  },
];

const COMMUNITIES = [
  {
    slug: "vaporwave-brasil",
    name: "Vaporwave Brasil",
    tagline: "A estética do mall demente em alta definição",
    description:
      "Lugar para discussões sobre vaporwave, nostalgia dos anos 90, edição de vídeo, sintetizadores e a arte de Nothing Much. Traga suas playlists.",
    theme: "#00e5ff",
    members: ["erick", "anabaena", "tadeu_88", "lara_v", "nina_pm", "carla_v"],
    posts: [
      {
        author: "erick",
        title: "Toda textura de vaporwave devia ter grão de filme",
        body: "Sem grão, vira apenas HTML sem alma. O grão é o que separa o Eames de uma div.",
        pinned: true,
        comments: [
          { author: "lara_v", body: "Concordo. E o chromatic aberration do VHS também." },
          { author: "tadeu_88", body: "Ninguém faz mais isso hoje em dia." },
        ],
      },
      {
        author: "anabaena",
        title: "Fotografia analógica × simulação de grão",
        body: "Testei 5 filtros de deslocamento sobre fotos digitais e o resultado foi outro. Vou postar o setup no meu perfil.",
        comments: [{ author: "nina_pm", body: "Manda! Quero replicar na web." }],
      },
      {
        author: "tadeu_88",
        title: "Qual o melhor player de MP3 dos anos 2000?",
        body: "Eu voto no Winamp. Mas o XMMS era mais leve.",
        comments: [],
      },
    ],
  },
  {
    slug: "programadores-3d",
    name: "Programadores 3D",
    tagline: "WebGL, shaders e a dor de compilar",
    description:
      "Comunidade para quem escreve shaders, mexe com Three.js, raymarching e performance de GPU. Ajuda mútua obrigatória.",
    theme: "#a855f7",
    members: ["erick", "mcurti", "rafa_tek", "otavio_m", "nina_pm", "zed_k"],
    posts: [
      {
        author: "otavio_m",
        title: "Dica: reduz draw calls antes de otimizar shaders",
        body: "90% do custo está em chamadas de desenho e mudanças de material. Antes de reescrever fragment shader, conta as draw calls.",
        pinned: true,
        comments: [
          { author: "rafa_tek", body: "Concordo. Instancing resolveu meu caso." },
          { author: "erick", body: "E nunca esqueça de checar overdraw." },
        ],
      },
      {
        author: "mcurti",
        title: "Raymarching em 20 linhas: vale a pena?",
        body: "É bonito, é caro, e serve muito bem para explicar SDF. Vamos fazer um tutorial na comunidade.",
        comments: [],
      },
    ],
  },
  {
    slug: "maravilhoso-2004",
    name: "Maravilhoso 2004",
    tagline: "Saudades como tecnologia",
    description:
      "BBS, disquete, MP3 de 320kbps, WMP skins, perfil cheio de visitors. Um túmulo afetivo com search bar.",
    theme: "#ff3d81",
    members: ["tadeu_88", "juninho_p", "bia_cos", "duda_s", "erick"],
    posts: [
      {
        author: "tadeu_88",
        title: "A melodia de login do Windows XP era uma obra-prima",
        body: "Ninguém fala disso. Aquele arpejo de cinco notas. Preciso de um arquivo MID para um evento especial.",
        comments: [
          { author: "bia_cos", body: "Tenho uma cópia em disquete virtual. Recomendo." },
        ],
      },
      {
        author: "juninho_p",
        title: "Lista do que não pode faltar nas redes antigas",
        body: "Vistas animadas, scrap com estrela, comunidades com banner de 468x60, claro.",
        comments: [{ author: "tadeu_88", body: "E o botão Enviar que brilhava. O core." }],
      },
    ],
  },
  {
    slug: "casa-e-jardim-3d",
    name: "Casa e Jardim 3D",
    tagline: "Plantas dentro do jogo",
    description:
      "Como usar motores 3D para planejar, iluminar e projetar o jardim que você sempre quis. Sem conhecimento de arquitetura.",
    theme: "#7cff4f",
    members: ["lara_v", "duda_s", "bia_cos"],
    posts: [
      {
        author: "duda_s",
        title: "Iluminação de tempestade com three temporais",
        body: "Usei bumps de normal map animados e um sistema de partículas pra chuva. Resultado surpreendente em 15 minutos.",
        comments: [],
      },
    ],
  },
];

async function main() {
  console.log("Resetando banco...");
  await prisma.$transaction([
    prisma.scrapComment.deleteMany(),
    prisma.scrap.deleteMany(),
    prisma.poke.deleteMany(),
    prisma.friendship.deleteMany(),
    prisma.shoutLike.deleteMany(),
    prisma.shout.deleteMany(),
    prisma.message.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.profileVisit.deleteMany(),
    prisma.communityComment.deleteMany(),
    prisma.communityPost.deleteMany(),
    prisma.communityMember.deleteMany(),
    prisma.community.deleteMany(),
    prisma.listing.deleteMany(),
    prisma.achievement.deleteMany(),
    prisma.photo.deleteMany(),
    prisma.video.deleteMany(),
    prisma.track.deleteMany(),
    prisma.book.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  console.log("Criando usuários...");
  const created = new Map<string, { id: string; uid: string }>();

  for (const [index, seedUser] of USERS.entries()) {
    const uid = `${1000 + index * 137}-${2000 + index * 91}-${3000 + index * 53}`;
    const user = await prisma.user.create({
      data: {
        uid,
        username: seedUser.username,
        name: seedUser.name,
        email: `${seedUser.username}@orb2088.dev`,
        passwordHash,
        avatarSeed: String((seedUser.username.length * 67 + index * 43) % 360),
        headline: seedUser.headline,
        quote: seedUser.quote,
        bio: `Morando em ${seedUser.city} — ${seedUser.state}. Aqui desde o começo da revolução 3D.`,
        aboutMe: `Sou ${seedUser.name}. Passo o dia fazendo ${seedUser.job.toLowerCase()}, mas de noite o render não para.`,
        city: seedUser.city,
        state: seedUser.state,
        country: "BR",
        gender: seedUser.gender ?? "",
        relationship: seedUser.relationship ?? "Solteiro(a)",
        hobbies: seedUser.hobbies,
        job: seedUser.job,
        school: "Escola pública de primeira série",
        lookingFor: "Pessoas que curtem conversa sobre o que está sendo construído.",
        favoriteMus: seedUser.music,
        profileViews: seedUser.views,
        credits: 500 + index * 37,
        lastSeenAt: new Date(Date.now() - index * 1000 * 60 * 43),
        createdAt: new Date(Date.now() - (USERS.length - index) * 1000 * 60 * 60 * 24 * 3),
      },
    });
    created.set(seedUser.username, { id: user.id, uid: user.uid });
  }

  const id = (username: string) => {
    const entry = created.get(username);
    if (!entry) throw new Error(`Usuário ${username} não encontrado no seed`);
    return entry;
  };

  console.log("Criando grafos de amizade...");
  const friendPairs: [string, string][] = [
    ["erick", "anabaena"],
    ["erick", "mcurti"],
    ["erick", "juninho_p"],
    ["erick", "tadeu_88"],
    ["erick", "rafa_tek"],
    ["erick", "otavio_m"],
    ["erick", "nina_pm"],
    ["anabaena", "lara_v"],
    ["anabaena", "duda_s"],
    ["anabaena", "bia_cos"],
    ["mcurti", "rafa_tek"],
    ["mcurti", "otavio_m"],
    ["juninho_p", "tadeu_88"],
    ["juninho_p", "bia_cos"],
    ["tadeu_88", "bia_cos"],
    ["tadeu_88", "duda_s"],
    ["lara_v", "duda_s"],
    ["rafa_tek", "zed_k"],
    ["nina_pm", "carla_v"],
    ["carla_v", "bia_cos"],
  ];

  for (const [a, b] of friendPairs) {
    await prisma.friendship.create({
      data: {
        requesterId: id(a).id,
        addresseeId: id(b).id,
        status: "ACCEPTED",
        respondedAt: new Date(),
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 20),
      },
    });
  }

  await prisma.friendship.create({
    data: { requesterId: id("zed_k").id, addresseeId: id("erick").id, status: "PENDING" },
  });
  await prisma.friendship.create({
    data: { requesterId: id("carla_v").id, addresseeId: id("erick").id, status: "PENDING" },
  });

  console.log("Criando cutucadas...");
  const pokePairs: [string, string, string][] = [
    ["anabaena", "erick", "poke"],
    ["mcurti", "erick", "wave"],
    ["juninho_p", "erick", "high-five"],
    ["erick", "tadeu_88", "hug"],
    ["erick", "nina_pm", "poke"],
    ["tadeu_88", "bia_cos", "poke"],
  ];

  for (const [from, to, kind] of pokePairs) {
    await prisma.poke.create({
      data: {
        fromId: id(from).id,
        toId: id(to).id,
        kind,
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 12),
      },
    });
  }

  console.log("Criando scraps...");
  const scraps: [string, string, string, string][] = [
    ["anabaena", "erick", "seu shader de nebulosa ficou absurdo 🔥", "\u{1F525}"],
    ["mcurti", "erick", "vi que você usa JOSE pra sessão. seguro demais. gostei.", "\u{1F44F}"],
    ["juninho_p", "erick", "kawaii core! seu perfil brilha mais que o meu", "\u{1F495}"],
    ["tadeu_88", "erick", "esse site parece a rede que eu sonhei. parabéns.", "\u{1F389}"],
    ["nina_pm", "erick", "o css do painel tá com um blur-perfect. manda o fonte.", "\u{1F60D}"],
    ["bia_cos", "erick", "passei 40 minutos na lista de comunidades. cadê o botão de sair?", "\u{1F602}"],
    ["lara_v", "anabaena", "essa foto neon é viewport envy", "\u{1F60D}"],
    ["duda_s", "lara_v", "me ensina a fazer chuva em three? 🙏", "\u{1F64C}"],
    ["rafa_tek", "otavio_m", "instancing > tudo", "\u{1F44F}"],
    ["erick", "anabaena", "passei seu perfil no grupo de fotografia 🎞️", "\u{1F4AA}"],
  ];

  for (const [author, profile, message, thumb] of scraps) {
    const scrap = await prisma.scrap.create({
      data: {
        authorId: id(author).id,
        profileId: id(profile).id,
        message,
        thumb,
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 9),
      },
    });

    if (Math.random() > 0.45) {
      await prisma.scrapComment.create({
        data: {
          scrapId: scrap.id,
          authorId: id(profile).id,
          body: "obrigado! 🙏",
          createdAt: new Date(),
        },
      });
    }
  }

  console.log("Criando recados...");
  const shouts = [
    ["erick", "construindo uma rede social em 3D. a original era lenta. essa roda a 60fps."],
    ["anabaena", "fotografei o neon refletido na esquina e saiu perfeito."],
    ["mcurti", "alguem ja conseguiu rodar raymarching a 60fps num celular mediocre? to tentando."],
    ["juninho_p", "esse scrapbook tem as mesmas vibes da minha primeira conta de 2004 😍"],
    ["tadeu_88", "achei uma fita VHS com grunge. chorando."],
    ["lara_v", "terminei a escultura 3D do gato. 400 mil polígonos. me julguem."],
    ["rafa_tek", "troquei meu cooler por rgb e a temperatura caiu 3 graus. valeu."],
    ["bia_cos", "conto de hoje: 347 comunidades visitadas, 12 criadas."],
    ["nina_pm", "escrevi 300 linhas de CSS e o layout quebrou em 1024px. chorando."],
    ["otavio_m", "por que em Rust e tao dificil? meu sono depende do tempo que levo pra escrever um test."],
    ["duda_s", "a tempestade de ontem rendeu 200 fotos. a melhor tem relâmpago cortado no meio."],
    ["carla_v", "modo escuro não é opcional. meu design system tem 14 pretos."],
    ["erick", "adicionem os amigos no scrapbook! o mural está vazio demais."],
    ["zed_k", "meu avatar 3D parece um poliedro. exatamente como eu pedi."],
  ];

  for (const [author, body] of shouts) {
    const shout = await prisma.shout.create({
      data: {
        authorId: id(author).id,
        body,
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 72),
      },
    });

    const likers = USERS.map((user) => user.username)
      .filter((username) => username !== author && Math.random() > 0.65)
      .slice(0, 5);

    for (const username of likers) {
      await prisma.shoutLike.create({ data: { shoutId: shout.id, userId: id(username).id } });
    }
  }

  console.log("Criando mensagens...");
  const messages: [string, string, string][] = [
    ["anabaena", "erick", "viu que o avatar procedural ficou perfeito? derivei a seed do username."],
    ["erick", "anabaena", "vi! ficou lindo. posso usar a mesma técnica no header?"],
    ["anabaena", "erick", "claro, é só hash + hsl. te mando o gist agora."],
    ["mcurti", "erick", "achei um bug: quando o scrap é privado, a lista ainda mostra no contador."],
    ["erick", "mcurti", "boa! vou arrumar. é só filtrar a query por visibilidade."],
    ["tadeu_88", "bia_cos", "viu o recurso de fixar tópico? finalmente uma comunidade de verdade."],
  ];

  for (const [from, to, body] of messages) {
    const read = Math.random() > 0.5 ? new Date() : null;
    await prisma.message.create({
      data: {
        fromId: id(from).id,
        toId: id(to).id,
        body,
        readAt: read,
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 48),
      },
    });
  }

  console.log("Criando comunidades...");
  for (const community of COMMUNITIES) {
    const ownerUsername = community.members[0];
    const communityRecord = await prisma.community.create({
      data: {
        slug: community.slug,
        name: community.name,
        tagline: community.tagline,
        description: community.description,
        theme: community.theme,
        seed: String(community.slug.length * 37),
        ownerId: id(ownerUsername).id,
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 40),
      },
    });

    for (const [index, username] of community.members.entries()) {
      await prisma.communityMember.create({
        data: {
          communityId: communityRecord.id,
          userId: id(username).id,
          role: index === 0 ? "MODERATOR" : "MEMBER",
        },
      });
    }

    for (const post of community.posts) {
      const postRecord = await prisma.communityPost.create({
        data: {
          communityId: communityRecord.id,
          authorId: id(post.author).id,
          title: post.title,
          body: post.body,
          pinned: Boolean(post.pinned),
          createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 15),
        },
      });

      for (const comment of post.comments) {
        await prisma.communityComment.create({
          data: {
            postId: postRecord.id,
            authorId: id(comment.author).id,
            body: comment.body,
          },
        });
      }
    }
  }

  console.log("Criando anúncios...");
  const listings: [string, string, number, string, string, string][] = [
    ["erick", "Teclado mecânico com switch quebrado", 180, "eletronicos", "São Paulo - SP", "Comprei usado, só a tecla W está falhando. Inclui keycap PBT."],
    ["anabaena", "Câmera filmadora analógica Hi8", 950, "eletronicos", "Recife - PE", "Lendo de fita, funciona perfeitamente. Quero trocar por uma camera digital medírea."],
    ["guto_fps", "Monitor 240Hz usado", 1400, "eletronicos", "Goiânia - GO", "Sem pixel dead, apenas uma mancha no canto inferior."],
    ["lara_v", "Tábua de cerâmica esmaltada", 220, "casa", "Salvador - BA", "Feita à mão, 30cm. Uso único, está perfeita."],
    ["nina_pm", "Livro: Designing Data-Intensive Applications", 120, "outros", "Vitória - ES", "Com marca-texto e um vinco de café na página 400. Clássico."],
    ["juninho_p", "Coleção de figurinhas (100 unidades)", 350, "outros", "Curitiba - PR", "Faltam 20 unidades. Vendo o lote inteiro."],
    ["rafa_tek", "Teclas mecânicas switches lineares (70un)", 640, "eletronicos", "Manaus - AM", "Montadas e testadas. Troco por táteis."],
    ["bia_cos", "Vinil LP da Coleção Defining Brazil", 260, "musica", "Fortaleza - CE", "Disco original com a capa levemente unmarked."],
    ["duda_s", "Bicicleta urbana aro 29", 900, "veiculos", "Natal - RN", "Pouco uso, freios novos. Não negocia."],
  ];

  for (const [seller, title, price, category, location, description] of listings) {
    await prisma.listing.create({
      data: {
        sellerId: id(seller).id,
        title,
        price,
        category,
        location,
        description,
        seed: String((title.length * 53) % 360),
      },
    });
  }

  console.log("Criando mídias de perfil...");
  for (const seedUser of USERS.slice(0, 10)) {
    for (let i = 0; i < 3; i++) {
      await prisma.photo.create({
        data: {
          userId: id(seedUser.username).id,
          seed: String((i * 97 + seedUser.name.length * 31) % 360),
          caption: [
            "Neon na janela",
            "Teste de grão",
            "Estudo de cor",
            "Longa exposição",
            "Reflexo em vidro",
          ][Math.floor(Math.random() * 5)],
        },
      });
    }

    await prisma.video.create({
      data: {
        userId: id(seedUser.username).id,
        title: "Tour pelo meu setup",
        seed: String((seedUser.name.length * 13) % 360),
      },
    });

    await prisma.track.create({
      data: {
        userId: id(seedUser.username).id,
        title: "Midnight Arcade",
        artist: ["VHS Dreams", "Neon Palms", "Grid Runner", "Slow Loader"][Math.floor(Math.random() * 4)],
        seed: String((seedUser.name.length * 71) % 360),
      },
    });

    await prisma.book.create({
      data: {
        userId: id(seedUser.username).id,
        title: "The Mythical Man-Month",
        author: "Frederick P. Brooks Jr.",
        status: "reading",
      },
    });
  }

  console.log("Criando notificacoes...");
  const notifications: [string, string, string][] = [
    ["erick", "anabaena", "poke"],
    ["erick", "mcurti", "poke"],
    ["erick", "juninho_p", "scrap"],
    ["erick", "tadeu_88", "scrap"],
    ["erick", "nina_pm", "scrap"],
    ["erick", "anabaena", "message"],
    ["erick", "zed_k", "friend_request"],
    ["erick", "carla_v", "friend_request"],
    ["erick", "anabaena", "friend_accepted"],
    ["erick", "bia_cos", "shout"],
    ["anabaena", "erick", "scrap"],
    ["anabaena", "erick", "poke"],
    ["mcurti", "erick", "message"],
    ["bia_cos", "erick", "friend_request"],
    ["lara_v", "erick", "scrap"],
  ];

  const hrefFor = (type: string, actor: string): string => {
    switch (type) {
      case "poke":
      case "scrap":
      case "friend_accepted":
        return `/app/profile/${id(actor).uid}`;
      case "message":
        return `/app/mensagens?to=${id(actor).uid}`;
      case "friend_request":
        return "/app/amigos";
      default:
        return "/app/feed";
    }
  };

  for (const [username, actor, type] of notifications) {
    const actorRecord = await prisma.user.findUniqueOrThrow({
      where: { username: actor },
      select: { id: true, name: true },
    });
    const verbs: Record<string, string> = {
      poke: `${actorRecord.name} cutucou você!`,
      scrap: `${actorRecord.name} deixou um scrap no seu perfil`,
      message: `${actorRecord.name} enviou uma mensagem privada`,
      friend_request: `${actorRecord.name} quer ser seu amigo no ORB // 2088`,
      friend_accepted: `${actorRecord.name} aceitou seu pedido de amizade`,
      shout: `${actorRecord.name} postou um novo recado`,
    };
    await prisma.notification.create({
      data: {
        userId: id(username).id,
        actorId: actorRecord.id,
        type,
        body: verbs[type] ?? "Nova atividade na sua rede",
        href: hrefFor(type, actor),
        readAt: Math.random() > 0.7 ? new Date() : null,
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 72),
      },
    });
  }

  console.log("Criando visitas e conquistas...");
  const visits = USERS.flatMap((_, i) =>
    USERS.filter((__, j) => j !== i)
      .slice(0, 5)
      .map((visitor) => ({
        profileId: id(USERS[i].username).id,
        visitorId: id(visitor.username).id,
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 5),
      })),
  );
  for (const visit of visits) {
    await prisma.profileVisit.create({ data: visit });
  }

  const achievements: [string, string, string, string][] = [
    ["erick", "fundador", "Fundador", "Criou a conta antes de todo mundo"],
    ["erick", "scrapper", "Scrapper compulsivo", "Deixou mais de 5 scraps em outros perfis"],
    ["anabaena", "fundador", "Fundador", "Criou a conta antes de todo mundo"],
    ["anabaena", "artista", "Olho clínico", "Publicou 5 fotos no perfil"],
    ["tadeu_88", "fundador", "Fundador", "Criou a conta antes de todo mundo"],
    ["tadeu_88", "nostalgia", "Memória EDM", "Respondeu a todo scrap com \"sim\""],
    ["mcurti", "bug_hunter", "Caçadora de bugs", "Reportou um problema real no sistema"],
    ["bia_cos", "viajante", "Viajante", "Entrou em 3 comunidades"],
    ["lara_v", "artista", "Olho clínico", "Publicou 5 fotos no perfil"],
  ];

  for (const [username, code, name, description] of achievements) {
    await prisma.achievement.create({
      data: { userId: id(username).id, code, name, description },
    });
  }

  const [users, communities, scrapsCount] = await Promise.all([
    prisma.user.count(),
    prisma.community.count(),
    prisma.scrap.count(),
  ]);

  console.log("");
  console.log(`Pronto: ${users} usuários, ${communities} comunidades, ${scrapsCount} scraps.`);
  console.log(`Login de demonstração: erick / ${PASSWORD}`);
  console.log(`UID do perfil principal: ${id("erick").uid}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
