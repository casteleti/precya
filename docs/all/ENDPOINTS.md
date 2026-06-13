# API Endpoints — DAKSA MVP

## 🔐 Auth

**POST /api/auth/login**
- Retorna JWT token

## 📅 Schedules

**GET /api/schedules** - Listar  
**POST /api/schedules** - Criar (409 on conflict)  
**PATCH /api/schedules/:id** - Remarcar  
**DELETE /api/schedules/:id** - Cancelar  
**POST /api/schedules/:id/complete** - Marcar concluída

## 👥 Clients

**GET /api/clients** - Listar  
**POST /api/clients** - Criar  
**GET /api/clients/:id** - Perfil + anamnesia  
**PATCH /api/clients/:id** - Editar  
**PUT /api/clients/:id/anamnesis** - Atualizar anamnesia (nova versão)

## 📋 Protocols

**GET /api/protocols** - Listar com analytics  
**POST /api/protocols** - Criar

---

**Última atualização:** Junho 2026
