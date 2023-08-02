import { createTestContext, generateAuthToken, seedUser } from './__helpers';
import { users } from '@prisma/dashboard';

const ctx = createTestContext();

describe('PSAs API', () => {
  let user: users;

  beforeAll(async () => {
    user = await seedUser({ ctx });
    if (!(await ctx.prisma.psas.findFirst())) {
      await ctx.prisma.psas.createMany({
        data: [
          {
            id: 78,
            title: 'Dave Thomas Foundation For Adoption',
            slug: 'dtfa',
            description:
              'The Dave Thomas Foundation for Adoption is the only public nonprofit charity in the United States that is focused exclusively on foster care adoption. We have a foster care crisis in the United States. Opting into this PSA will help drive awareness to the crisis, and ways to help.',
            gam_key: '17',
            created_at: '2022-05-31T15:28:42.763Z',
            updated_at: '2022-05-31T15:28:42.763Z',
          },
          {
            id: 79,
            title: 'Sandy Hook Promise',
            slug: 'sandyhook',
            description:
              "Sandy Hook Promise's mission is to end school shootings and create a culture change that prevents violence and other harmful acts that hurt children. Opt into this PSA to drive awareness to Sandy Hook Promise's mission and ways to help that.",
            gam_key: '18',
            created_at: '2022-05-31T15:30:51.657Z',
            updated_at: '2022-05-31T15:30:51.657Z',
          },
          {
            id: 71,
            title: 'United Way ',
            slug: 'unitedway',
            description:
              'United Way improves lives by mobilizing the caring power of communities around the world to advance the common good. PSAs featuring United Way-led initiatives will be updated often, and include things like the 211 campaign, COVID-19 Vaccination encouragement and more.',
            gam_key: '10',
            created_at: '2021-01-26T15:46:40.252Z',
            updated_at: '2021-01-26T15:46:40.252Z',
          },
          {
            id: 2,
            title: 'We Stand With You PSAs',
            slug: 'wswy',
            description:
              'We stand with you against racism. This PSA campaign features art created by Black and Asian-American artists in the pursuit of advocacy for social justice.',
            gam_key: '2',
            created_at: '2020-06-04T17:37:52.860Z',
            updated_at: '2022-03-10T21:25:56.742Z',
          },
          {
            id: 1,
            title: 'COVID-19 PSAs',
            slug: 'covid',
            description:
              'These PSAs encourage hand washing, social distancing, and mask wearing, to slow the spread of COVID-19.',
            gam_key: '1',
            created_at: '2020-06-04T17:36:40.536Z',
            updated_at: '2022-03-10T21:26:18.719Z',
          },
          {
            id: 76,
            title: 'AdTechCares',
            slug: 'adtechcares',
            description:
              'AdTechCares PSAs are currently dedicated entirely to messages in support of Ukraine.',
            gam_key: '16',
            created_at: '2021-11-10T17:56:10.167Z',
            updated_at: '2022-03-24T18:37:54.631Z',
          },
          {
            id: 5,
            title: "Alzheimer's Awareness",
            slug: 'adcouncil_alzheimers',
            description:
              "An early diagnosis of Alzheimer's provides a range of benefits for the individuals who are diagnosed. Turn on this PSA to help bring awareness to those signs.",
            gam_key: '5',
            created_at: '2020-12-10T16:15:17.536Z',
            updated_at: '2020-12-10T16:15:17.536Z',
          },
          {
            id: 6,
            title: 'Empowering Girls in STEM',
            slug: 'adcouncil_girlsstem',
            description:
              'She Can STEM shows girls that STEM is in everything, and experimenting is part of the journey. Empower girls in STEM by bringing awareness with these PSAs.',
            gam_key: '6',
            created_at: '2020-12-10T16:15:17.536Z',
            updated_at: '2020-12-10T16:15:17.536Z',
          },
          {
            id: 7,
            title: 'High Blood Pressure',
            slug: 'adcouncil_bloodpressure',
            description:
              "Nearly half of American adults have high blood pressure, and many don't even know it. Help readers learn the risk factors by enabling this PSA. Make a difference in the knowledge around this silent killer.",
            gam_key: '7',
            created_at: '2020-12-10T16:15:17.536Z',
            updated_at: '2020-12-10T16:15:17.536Z',
          },
          {
            id: 8,
            title: 'Teen Suicide Prevention',
            slug: 'adcouncil_teensuicide',
            description:
              'The Seize the Awkward PSA campaign is geared towards how to have hard conversations with the teens in your life. Mental health is hard to talk about, but doing it can make all the difference.',
            gam_key: '8',
            created_at: '2020-12-10T16:15:17.536Z',
            updated_at: '2020-12-10T16:15:17.536Z',
          },
          {
            id: 9,
            title: 'Texting and Driving Prevention',
            slug: 'adcouncil_txtnddrv',
            description:
              'This PSA campaign reminds drivers from 16 to 34 that no one is special enough to text and drive. Text and whatever. Just don’t text and drive.',
            gam_key: '9',
            created_at: '2020-12-10T16:15:17.536Z',
            updated_at: '2020-12-10T16:15:17.536Z',
          },
          {
            id: 73,
            title: 'PFLAG National',
            slug: 'pflag',
            description:
              "PFLAG's vision is to create a world where difference is celebrated and all people are valued inclusive of their sexual orientation, gender identity and gender expression. PFLAG is the first and largest organization for LGBTQ+ people, their parents and families, and allies, advocating for supportive and affirming families; safe and inclusive schools; and workplaces, faith communities, and neighborhoods free from discrimination, harassment, and harm.",
            gam_key: '13',
            created_at: '2021-06-15T13:51:08.550Z',
            updated_at: '2021-06-15T13:51:08.550Z',
          },
          {
            id: 74,
            title: 'COVID-19 Vaccination Education',
            slug: 'adcouncil_vaccineed',
            description:
              'The COVID-19 Vaccine Education Initiative is led by the Ad Council and the COVID Collaborative with the involvement of the Centers for Disease Control and Prevention (CDC) to educate the American public and build confidence around the COVID-19 vaccines.',
            gam_key: '14',
            created_at: '2021-06-15T19:25:42.910Z',
            updated_at: '2021-06-15T19:25:42.910Z',
          },
          {
            id: 3,
            title: "Cookies for Kids' Cancer",
            slug: 'cookies',
            description:
              "Cookies for Kids' Cancer raises money for pediatric cancer research. As one of the most underfunded areas of cancer, the money they raise each year is imperative to finding new treatments for various forms of childhood cancer.",
            gam_key: '3',
            created_at: '2020-09-03T16:59:27.110Z',
            updated_at: '2020-09-03T16:59:27.110Z',
          },
          {
            id: 4,
            title: 'Operation Gratitude',
            slug: 'operationgratitude',
            description:
              "Operation Gratitude's mission is to forge strong bonds between Americans and their Military and First Responder Heroes through volunteer service projects, acts of gratitude, and meaningful engagements in communities nationwide.",
            gam_key: '4',
            created_at: '2020-09-23T15:20:17.630Z',
            updated_at: '2020-09-23T15:20:17.630Z',
          },
          {
            id: 11,
            title: 'Encourage Pet Adoption PSAs ',
            slug: 'petadoption',
            description:
              'From cats and pups to guinea pigs and chickens, we love rescued pets! If you love animals as much as we do, this campaign is for you. The PSA points to our landing page, with worldwide resources related to animal rescue, making this campaign perfect for all publishers.',
            gam_key: '11',
            created_at: '2021-04-07T14:25:26.674Z',
            updated_at: '2021-04-07T14:25:26.674Z',
          },
          {
            id: 72,
            title: 'No Kid Hungry',
            slug: 'nokidhungry',
            description:
              'Millions of kids in the United States are living with hunger right now because of the pandemic. With No Kid Hungry, you can help change that for good. This PSA helps generate awareness and donations to help end childhood hunger in the United States. (US traffic only.)',
            gam_key: '12',
            created_at: '2021-04-27T14:53:01.733Z',
            updated_at: '2021-04-27T14:53:01.733Z',
          },
          {
            id: 75,
            title: 'Big Brothers Big Sisters',
            slug: 'bbbs',
            description:
              'Big Brothers Big Sisters of America helps uplift our youth facing adversity through its mentorship services. Opting in could help the 30,000 youth waiting for a mentor find their perfect matches. ',
            gam_key: '15',
            created_at: '2021-08-10T13:30:50.866Z',
            updated_at: '2021-08-10T13:30:50.866Z',
          },
        ],
      });
    }
  });

  describe('/api/v1/psas', () => {
    it('lists all psas', async () => {
      const resp = await fetch(`${ctx.host}/api/v1/psas`, {
        headers: {
          Authorization: generateAuthToken(user),
        },
      });
      const body = await resp.json();
      expect(body).toMatchInlineSnapshot(`
        {
          "psas": [
            {
              "description": "The Dave Thomas Foundation for Adoption is the only public nonprofit charity in the United States that is focused exclusively on foster care adoption. We have a foster care crisis in the United States. Opting into this PSA will help drive awareness to the crisis, and ways to help.",
              "gam_key": "17",
              "id": 78,
              "slug": "dtfa",
              "title": "Dave Thomas Foundation For Adoption",
            },
            {
              "description": "Sandy Hook Promise's mission is to end school shootings and create a culture change that prevents violence and other harmful acts that hurt children. Opt into this PSA to drive awareness to Sandy Hook Promise's mission and ways to help that.",
              "gam_key": "18",
              "id": 79,
              "slug": "sandyhook",
              "title": "Sandy Hook Promise",
            },
            {
              "description": "United Way improves lives by mobilizing the caring power of communities around the world to advance the common good. PSAs featuring United Way-led initiatives will be updated often, and include things like the 211 campaign, COVID-19 Vaccination encouragement and more.",
              "gam_key": "10",
              "id": 71,
              "slug": "unitedway",
              "title": "United Way ",
            },
            {
              "description": "We stand with you against racism. This PSA campaign features art created by Black and Asian-American artists in the pursuit of advocacy for social justice.",
              "gam_key": "2",
              "id": 2,
              "slug": "wswy",
              "title": "We Stand With You PSAs",
            },
            {
              "description": "These PSAs encourage hand washing, social distancing, and mask wearing, to slow the spread of COVID-19.",
              "gam_key": "1",
              "id": 1,
              "slug": "covid",
              "title": "COVID-19 PSAs",
            },
            {
              "description": "AdTechCares PSAs are currently dedicated entirely to messages in support of Ukraine.",
              "gam_key": "16",
              "id": 76,
              "slug": "adtechcares",
              "title": "AdTechCares",
            },
            {
              "description": "An early diagnosis of Alzheimer's provides a range of benefits for the individuals who are diagnosed. Turn on this PSA to help bring awareness to those signs.",
              "gam_key": "5",
              "id": 5,
              "slug": "adcouncil_alzheimers",
              "title": "Alzheimer's Awareness",
            },
            {
              "description": "She Can STEM shows girls that STEM is in everything, and experimenting is part of the journey. Empower girls in STEM by bringing awareness with these PSAs.",
              "gam_key": "6",
              "id": 6,
              "slug": "adcouncil_girlsstem",
              "title": "Empowering Girls in STEM",
            },
            {
              "description": "Nearly half of American adults have high blood pressure, and many don't even know it. Help readers learn the risk factors by enabling this PSA. Make a difference in the knowledge around this silent killer.",
              "gam_key": "7",
              "id": 7,
              "slug": "adcouncil_bloodpressure",
              "title": "High Blood Pressure",
            },
            {
              "description": "The Seize the Awkward PSA campaign is geared towards how to have hard conversations with the teens in your life. Mental health is hard to talk about, but doing it can make all the difference.",
              "gam_key": "8",
              "id": 8,
              "slug": "adcouncil_teensuicide",
              "title": "Teen Suicide Prevention",
            },
            {
              "description": "This PSA campaign reminds drivers from 16 to 34 that no one is special enough to text and drive. Text and whatever. Just don’t text and drive.",
              "gam_key": "9",
              "id": 9,
              "slug": "adcouncil_txtnddrv",
              "title": "Texting and Driving Prevention",
            },
            {
              "description": "PFLAG's vision is to create a world where difference is celebrated and all people are valued inclusive of their sexual orientation, gender identity and gender expression. PFLAG is the first and largest organization for LGBTQ+ people, their parents and families, and allies, advocating for supportive and affirming families; safe and inclusive schools; and workplaces, faith communities, and neighborhoods free from discrimination, harassment, and harm.",
              "gam_key": "13",
              "id": 73,
              "slug": "pflag",
              "title": "PFLAG National",
            },
            {
              "description": "The COVID-19 Vaccine Education Initiative is led by the Ad Council and the COVID Collaborative with the involvement of the Centers for Disease Control and Prevention (CDC) to educate the American public and build confidence around the COVID-19 vaccines.",
              "gam_key": "14",
              "id": 74,
              "slug": "adcouncil_vaccineed",
              "title": "COVID-19 Vaccination Education",
            },
            {
              "description": "Cookies for Kids' Cancer raises money for pediatric cancer research. As one of the most underfunded areas of cancer, the money they raise each year is imperative to finding new treatments for various forms of childhood cancer.",
              "gam_key": "3",
              "id": 3,
              "slug": "cookies",
              "title": "Cookies for Kids' Cancer",
            },
            {
              "description": "Operation Gratitude's mission is to forge strong bonds between Americans and their Military and First Responder Heroes through volunteer service projects, acts of gratitude, and meaningful engagements in communities nationwide.",
              "gam_key": "4",
              "id": 4,
              "slug": "operationgratitude",
              "title": "Operation Gratitude",
            },
            {
              "description": "From cats and pups to guinea pigs and chickens, we love rescued pets! If you love animals as much as we do, this campaign is for you. The PSA points to our landing page, with worldwide resources related to animal rescue, making this campaign perfect for all publishers.",
              "gam_key": "11",
              "id": 11,
              "slug": "petadoption",
              "title": "Encourage Pet Adoption PSAs ",
            },
            {
              "description": "Millions of kids in the United States are living with hunger right now because of the pandemic. With No Kid Hungry, you can help change that for good. This PSA helps generate awareness and donations to help end childhood hunger in the United States. (US traffic only.)",
              "gam_key": "12",
              "id": 72,
              "slug": "nokidhungry",
              "title": "No Kid Hungry",
            },
            {
              "description": "Big Brothers Big Sisters of America helps uplift our youth facing adversity through its mentorship services. Opting in could help the 30,000 youth waiting for a mentor find their perfect matches. ",
              "gam_key": "15",
              "id": 75,
              "slug": "bbbs",
              "title": "Big Brothers Big Sisters",
            },
          ],
        }
      `);
    });

    it("returns an error if the user isn't authenticated", async () => {
      const resp = await fetch(`${ctx.host}/api/v1/psas`);
      expect(resp.status).toEqual(401);
    });
  });
});
