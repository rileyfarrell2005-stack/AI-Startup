# Project log

Keep this up to date as you go — a few lines per work session is enough. It's much harder to reconstruct at the end.

**Team name:** Individual Project
**Startup name:** FixerUpper Appliance Repair
**Live site link:** https://rileyfarrell2005-stack.github.io/AI-Startup/

---

## Work sessions

Copy this block for each session.

### Session — [11/24] — driver: [Riley]

- **Goal for this session:** Learn to code it and test Copilot's abilities.
- **Key prompts we gave Copilot**  
  1. can you add a code for my website, called fixerupper which is an online appliance repair service where both customers and technicians can interact
  2. so next we will work on how the app works, it will bring you to a homescreen that has 3 options at the bottom . "request services" , " provide services" and the third one being settings/customer help, once you chose the one that applies to you by clicking on the screen, you are redirected to a screen of listings for available resources and filters to filter out any service providers you may not be seeking at this particular monet, the app colour will be read which will be bordered around the app in a light but easy to read fashion, searches will provide the people in your area that have the quickest time to come repair your appliance, the filters in the app will help make this work, in order to book you click a book service button once you click on someones profile and fill out a brief statement of the problem and what appliance has the problem, they will then come back with a quote for the work and the customer will decide whether they would like the service or not, they are able to rate technicians and the app does not meet with customers, just the people who use it
     
- **What worked:** everything worked well for the opening stage of the project
- **What broke, and how we fixed it:** had to change some things as I learned how to use the copilot
- **Committed?** yes — related commit: `Build FixerUpper appliance repair marketplace prototype` (`fceaa86`)
---
### Session — [11/25] — driver: [Riley]

- **Goal for this session:** build customer and technician data
- **Key prompts we gave Copilot** (paste the important ones): 
  1. allow customers to Search by appliance type (fridge, washer, dryer, dishwasher, etc.).
  2. allow customers to create an account
- **What worked:** adding the account system was pretty easy but tedious, as there was a lot of components I added to make the system more user friendly, as well as better data protection
- **What broke, and how we fixed it:** I figured out what went wrong with the code and tested it multiple times to make sure it worked
- **Committed?** yes — related commit: `Simplify booking flow and add customizable technician search filters` (`f07dff6`)
---
### Session — [11/25] — driver: [Riley]

- **Goal for this session:** deploy app and see what the happens.
- **Key prompts we gave Copilot** (paste the important ones):
  1.can you remove the 2 factor authentication code due to it causing a server error
  2. can you connect to render and let me know how to fix these coding errors in order to deploy my app.
- **What worked:** the app successfully launched
- **What broke, and how we fixed it:** the app failed to launch many times due to errors in variables that I hadn't noticed, but I corrected what it had asked me to do by asking copilot for help. it guided me to the environment variable in the render app and eventually deployed my app and connected it to the internet. the app also locked itself after putting in the 6-digit authentication code so I removed it in favour of keeping the regular authentication
- **Committed?** yes — related commit: `Prepare FixerUpper for Render deployment` (`30c28e3`)
---

### Session — [11/26] — driver: [Riley]

- **Goal for this session:** test app and configure sign in tools
- **Key prompts we gave Copilot** (paste the important ones):
  1. add a privacy control center under setting, to view View stored account information.
  2. add allow or disallown notifications for all parties who use this app
- **What worked:** the sign in page
- **What broke, and how we fixed it:** the sign in page broke and crashed several times due to this change, I asked copilot to undo code that broke the app until I had a competent login/logout system, then kept building it piece by piece, testing everything as I went
- **Committed?** yes — related commit: `Update PROJECT_LOG.md` (`7c5b1ca`)
---

### Session — [11/27] — driver: [Riley]

- **Goal for this session:** Use GitHub Pages for the live static prototype.
- **What worked:** GitHub Pages built and deployed the site from the main branch. The app uses a local demo sign-in and stores requests in the browser.
- **What broke, and how we fixed it:** Notification preference controls could turn off when browser notifications were unavailable. The preferences were updated to save and show in-app updates instead.
- **Committed?** yes — related commits: `Remove runtime add-ons from static site` (`375472b`), `Add reusable local demo sign-in` (`4afe4a1`), and `Fix notification preferences on mobile` (`9a95f1a`)
---

## Things that broke (running list)

| Date | What went wrong | What we tried | What finally fixed it |
|---|---|---|---|
|11/24|formatting issues at the start | Copilot was asked to design the app with a simple but efficient look. | copilot had developed exactly what I was looking for |
|11/24|the app crashed a lot|I went on render and tried adding variables to the deployment|this fixed the deployment issue as I now had the correct code|
|11/26|the sign in page broke and locked me out of the app| was trying to add a 2nd password protected wall for security| playing around with copilot eventually led me to fixing the login screen.|
|11/26|The login and logout screen became unusable due to coding errors by copilot while polishing the account database feature| this led to me running out of free AI use to help with the finishing touches on my app|reported to professor via email but undoubtedly, a huge issue.|
---

## What a real version would need

Everything we wanted but faked or left out — real logins, a real database, payments, security, moderation, an app, staff, etc. For each one, say **why** it's needed and roughly **how hard or expensive** you think it would be.

| Feature we faked or skipped | Why a real company would need it | How hard / expensive? |
|---|---|---|
| faked true 3rd party authentication | a real company needs layers to protect its customers against data breaches | this would be expensive for the company to implement as it requires an auditor to monitor the servers |
| we faked the requests going to the technicians inbox since you are unable to use another technicians account in this prototype | this app does not automatically request technicians for customers since this is a fictional app. A real company would require this feature as it is central to functionality within the app | This feature would be easy and inexpensive to add into my app |
| I skipped adding a chat bot into the app due to it not being important for my current project | A real company would need this because it provides an assist answer easier questions about simpler customer/technician thoughts and/or complaints | this would be mildly expensive to add and code to have certain answers |
| I skipped adding automatic replies to requests due to it being potentially misleading | this is not that important for a real company unless you'd want to make it seem more efficient | this would be easy and inexpensive to add into a project |
| I skipped adding a way to process real payments | a real company needs to secure funds before an objective is completed | moderately costly to add and connect to a payment provider among other things |
| Shared cloud database | Customers and technicians need to access the same requests and updates across devices. | Moderately difficult and costly: it would require hosting, secure access controls, backups and ongoing maintenance. |
---

## Reflection

### 1. What surprised you most about building software with AI?
What surprised me most about building software with AI was how easy it was to write code and fine-tune the project along the way. Before starting this project, I expected that creating a website with several different features would require a lot more coding knowledge and time. However, using AI made it much easier to explain what I wanted the application to do and get help turning those ideas into working features. One thing I found especially useful was being able to make changes as the project developed. If I wanted to add something, improve the layout or change how a feature worked, I could explain the problem and get suggestions for how to fix it. This made it easier to experiment without having to build everything from scratch. I also learned that AI can help with more than just writing code. It can assist with troubleshooting, explaining errors and suggesting ways to improve something that is already built. The biggest surprise was how quickly an idea could turn into something that people could actually interact with. It showed me that developing a basic application is much more accessible than I originally thought.

### 2. Which parts were easy, and which were hard? Why do you think that is?
The easiest part was probably getting the initial website built and making changes to its features. AI could generate much of the code needed to create different sections of FixerUpper, which saved a considerable amount of time. It was also relatively easy to ask for adjustments and improve parts of the website without having to understand every line of code myself. The more challenging part was launching the application and getting everything working together. This required more manual effort because I had to find the correct files, understand where changes needed to be made and figure out how the different parts of the application connected. Even when AI provided the code, I still had to make sure it was being added in the right place and that it worked with the rest of the project. I think the difference comes down to how AI handles individual tasks compared with managing an entire project. It can generate code fairly quickly when given clear instructions, but putting everything together requires more attention and understanding. I learned that using AI does not mean every part of development becomes automatic. You still need to check the work, make decisions and understand what you are building.

### 3. If a competitor had the same AI tool, how long would it take them to copy your site?
I don't think it would take a competitor very long to create a website similar to FixerUpper if they had access to the same AI tools. Most of the features were developed using readily available technology, and AI makes it much easier to build an application without having years of coding experience. A competitor could use similar prompts and develop something with technician listings, customer requests, booking features and other basic functions in a relatively short amount of time. However, copying the website would not necessarily mean copying the business successfully. The more difficult part would be getting independent technicians to join, building relationships with them and convincing customers to trust the service. A new competitor would also need to establish a good reputation and collect enough customer reviews to make the platform useful. This connects to the competitive advantage discussed in my business case. The technology itself is not what would make FixerUpper successful because another business could build something similar. Its potential advantage would come from the relationships, customer trust, repair history and network developed over time. Overall, this project showed me that AI can make building software much easier, but creating a business that people actually want to use requires much more than having a working website.
