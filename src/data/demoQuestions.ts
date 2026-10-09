export const demoQuestionsJson = JSON.stringify([
  {
    question: '¿Cuál es el hueso más largo del cuerpo humano?',
    options: ['El húmero', 'El fémur', 'La tibia', 'El radio'],
    correct: 1,
    explanation: 'El fémur va desde la cadera hasta la rodilla.',
  },
  {
    question: '¿En qué año se independizó Bolivia?',
    options: ['1809', '1825', '1879', '1900'],
    correct: 1,
    explanation: 'Bolivia declaró su independencia el 6 de agosto de 1825.',
  },
  {
    question: '¿Cuál es el planeta más cercano al Sol?',
    options: ['Venus', 'Mercurio', 'Marte', 'Tierra'],
    correct: 1,
  },
  {
    question: '¿Qué gas usan las plantas para hacer fotosíntesis?',
    options: ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Hidrógeno'],
    correct: 2,
  },
  {
    question: '¿Quién pintó La Gioconda?',
    options: ['Miguel Ángel', 'Rafael', 'Leonardo da Vinci', 'Donatello'],
    correct: 2,
  },
  {
    question: '¿Cuál es el lago navegable más alto del mundo?',
    options: ['Lago Titicaca', 'Lago Poopó', 'Lago Victoria', 'Lago Baikal'],
    correct: 0,
    explanation: 'Está en la frontera entre Bolivia y Perú, a más de 3800 msnm.',
  },
  {
    question: '¿Cuántos lados tiene un heptágono?',
    options: ['6', '7', '8', '9'],
    correct: 1,
  },
  {
    type: 'open',
    question: 'Explique brevemente qué es la fotosíntesis.',
    expectedAnswer:
      'La fotosíntesis es el proceso mediante el cual las plantas convierten dióxido de carbono, agua y luz solar en glucosa y oxígeno, usando la clorofila de sus células.',
  },
  {
    type: 'open',
    question: '¿Qué diferencia a una pila de una cola como estructura de datos?',
    expectedAnswer:
      'Una pila sigue el principio LIFO (el último elemento en entrar es el primero en salir), mientras que una cola sigue el principio FIFO (el primer elemento en entrar es el primero en salir).',
  },
]);
