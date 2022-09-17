import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client';
import { convertHourStringToMinutes } from './utils/conver-hour-string-to-minutes';
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string';
import axios from 'axios';

// https://discord.com/api/oauth2/authorize?client_id=1020770031807762452&redirect_uri=http%3A%2F%2Flocalhost%3A3333%2Fauth%2Fdiscord&response_type=code&scope=identify
const app = express()
app.use(express.json())
app.use(cors())

const prisma = new PrismaClient({
  // log: ['query']
})

app.get('/games', async (request, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        },
      },
    }
  });

  return response.json(games);
})

app.post('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;
  const body: any = request.body;

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(','),
      hourStart: convertHourStringToMinutes(body.hourStart),
      hourEnd: convertHourStringToMinutes(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel,
    }
  })

  return response.status(201).json(ad);
})

app.get('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourStart: true,
      hourEnd: true,
    },
    where: {
      gameId: gameId,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  return response.json(ads.map(ad => {
    return {
      ...ad,
      weekDays: ad.weekDays.split(','),
      hourStart: convertMinutesToHourString(ad.hourStart),
      hourEnd: convertMinutesToHourString(ad.hourEnd),
    }
  }))
})

app.get('/ads/:id/discord', async (request, response) => {
  const adId = request.params.id;

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId,
    },
  })
  return response.json({
    discord: ad.discord,
  })
})

app.get('/discordAuth', (request, response) => {
  response.send(`
  <div style="margin: 300px auto;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: sans-serif;"
  >
      <h3>Welcome to Discord OAuth NodeJS App</h3>
      <p>Click on the below button to get started!</p>
      <a 
          href="https://discord.com/api/oauth2/authorize?client_id=1020770031807762452&redirect_uri=http%3A%2F%2Flocalhost%3A3333%2Fauth%2Fdiscord&response_type=code&scope=identify"
          style="outline: none;
          padding: 10px;
          border: none;
          font-size: 20px;
          margin-top: 20px;
          border-radius: 8px;
          background: #6D81CD;
          cursor:pointer;
          text-decoration: none;
          color: white;"
      >
      Login with Discord</a>
  </div>
  `)
})

app.get('/auth/discord', async (req, res) => {
  const code = (req.query as any).code;
  const params = new URLSearchParams();
  let user;
  params.append('client_id', process.env.CLIENT_ID!);
  params.append('client_secret', process.env.CLIENT_SECRET!);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', "http://localhost:3333/auth/discord");
  try {
    const response = await axios.post('https://discord.com/api/oauth2/token', params)
    const { access_token, token_type } = response.data;
    const userDataResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        authorization: `${token_type} ${access_token}`
      }
    })
    console.log('Data: ', userDataResponse.data)
    user = {
      username: userDataResponse.data.username

    }
    return res.send(`
          <div style="margin: 300px auto;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: sans-serif;"
          >
              <h3>Welcome ${user.username}</h3>
          </div>
      `)

  } catch (error) {
    console.log('Error', error)
    return res.send('Some error occurred! ')
  }
})

app.listen(3333)