$(document).ready(function() {
    if (!Auth.requireAuth()) return;
    
    const user = Auth.getCurrentUser();
    const path = window.location.pathname.split('/').pop();
    
    atualizarInterfaceUsuario(user);
    
    if (path === 'dashboard.html') {
        carregarDashboard(user);
    } else if (path === 'perfil.html') {
        carregarPerfil(user);
    }
});

function atualizarInterfaceUsuario(user) {
    $('#nomeUsuario').text(user.nome.split(' ')[0]);
    
    if (user.is_admin) {
        $('#badgeAdmin').show();
        $('.admin-only').show();
    } else if (user.is_tecnico) {
        $('#badgeTecnico').show();
    } else {
        $('#badgeUsuario').show();
    }
}

function carregarDashboard(user) {
    $('#welcome-nome').text(user.nome.split(' ')[0]);
    $('#welcome-email').text(user.email);
    $('#welcome-data').text(new Date(user.data_cadastro).toLocaleDateString('pt-BR'));
    
    let tipoText = '';
    if (user.is_admin) tipoText = '<span class="badge bg-primary">Administrador</span>';
    else if (user.is_tecnico) tipoText = '<span class="badge bg-info">Técnico</span>';
    else tipoText = '<span class="badge bg-secondary">Usuário Padrão</span>';
    $('#welcome-tipo').html(tipoText);
    
    const chamados = DB.getChamados();
    
    let total, abertos, andamento, resolvidos, meusChamados;
    
    if (user.is_admin) {
        total = chamados.length;
        abertos = chamados.filter(c => c.status === 'aberto').length;
        andamento = chamados.filter(c => c.status === 'em_andamento').length;
        resolvidos = chamados.filter(c => c.status === 'resolvido').length;
        meusChamados = chamados.filter(c => c.usuario_id === user.id).length;
    } else {
        meusChamados = chamados.filter(c => c.usuario_id === user.id).length;
        abertos = chamados.filter(c => c.usuario_id === user.id && c.status === 'aberto').length;
        andamento = chamados.filter(c => c.usuario_id === user.id && c.status === 'em_andamento').length;
        resolvidos = chamados.filter(c => c.usuario_id === user.id && c.status === 'resolvido').length;
        total = meusChamados;
    }
    
    $('#cards-estatisticas').html(`
        <div class="col-md-3">
            <div class="card text-white bg-primary">
                <div class="card-body">
                    <h5 class="card-title">Total</h5>
                    <h2>${total}</h2>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-white bg-warning">
                <div class="card-body">
                    <h5 class="card-title">Abertos</h5>
                    <h2>${abertos}</h2>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-white bg-info">
                <div class="card-body">
                    <h5 class="card-title">Andamento</h5>
                    <h2>${andamento}</h2>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-white bg-success">
                <div class="card-body">
                    <h5 class="card-title">Resolvidos</h5>
                    <h2>${resolvidos}</h2>
                </div>
            </div>
        </div>
    `);
    
    $('#meus-chamados-count').text(meusChamados);
    
    let ultimos;
    if (user.is_admin) {
        ultimos = chamados.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao)).slice(0, 5);
    } else {
        ultimos = chamados.filter(c => c.usuario_id === user.id)
                         .sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao))
                         .slice(0, 5);
    }
    
    if (ultimos.length === 0) {
        $('#tabela-ultimos-chamados').html('<tr><td colspan="6" class="text-center">Nenhum chamado encontrado.</td></tr>');
        return;
    }
    
    let html = '';
    ultimos.forEach(chamado => {
        const statusClass = {
            'aberto': 'bg-warning',
            'em_andamento': 'bg-info',
            'resolvido': 'bg-success'
        }[chamado.status] || 'bg-secondary';
        
        const prioridadeClass = {
            'baixa': 'bg-success',
            'media': 'bg-info',
            'alta': 'bg-warning',
            'urgente': 'bg-danger'
        }[chamado.prioridade] || 'bg-secondary';
        
        html += `
            <tr>
                <td>#${chamado.id}</td>
                <td>${chamado.titulo.substring(0, 30)}${chamado.titulo.length > 30 ? '...' : ''}</td>
                <td><span class="badge ${statusClass}">${chamado.status.replace('_', ' ')}</span></td>
                <td><span class="badge ${prioridadeClass}">${chamado.prioridade}</span></td>
                <td>${new Date(chamado.data_criacao).toLocaleDateString('pt-BR')}</td>
                <td>
                    <a href="detalhe-chamado.html?id=${chamado.id}" class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-eye"></i>
                    </a>
                </td>
            </tr>
        `;
    });
    
    $('#tabela-ultimos-chamados').html(html);
}

function carregarPerfil(user) {
    $('#perfil-nome').text(user.nome);
    $('#perfil-email').text(user.email);
    
    let badgeHtml = '';
    if (user.is_admin) badgeHtml = '<span class="badge bg-primary" style="font-size: 1rem;">Administrador</span>';
    else if (user.is_tecnico) badgeHtml = '<span class="badge bg-info" style="font-size: 1rem;">Técnico</span>';
    else badgeHtml = '<span class="badge bg-secondary" style="font-size: 1rem;">Usuário Padrão</span>';
    $('#perfil-badge').html(badgeHtml);
    
    $('#perfil-data').text(new Date(user.data_cadastro).toLocaleDateString('pt-BR'));
    $('#perfil-ultimo-acesso').text(user.ultimo_acesso ? new Date(user.ultimo_acesso).toLocaleString('pt-BR') : 'Primeiro acesso');
    $('#perfil-status').html(user.ativo ? '<span class="text-success">Ativo</span>' : '<span class="text-danger">Inativo</span>');
    
    const chamados = DB.getChamadosByUsuario(user.id);
    const abertos = chamados.filter(c => c.status === 'aberto').length;
    const andamento = chamados.filter(c => c.status === 'em_andamento').length;
    const resolvidos = chamados.filter(c => c.status === 'resolvido').length;
    
    $('#estatisticas-cards').html(`
        <div class="col-md-3">
            <div class="card bg-primary text-white">
                <div class="card-body text-center">
                    <h3>${chamados.length}</h3>
                    <small>Total</small>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-warning text-white">
                <div class="card-body text-center">
                    <h3>${abertos}</h3>
                    <small>Abertos</small>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-info text-white">
                <div class="card-body text-center">
                    <h3>${andamento}</h3>
                    <small>Andamento</small>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card bg-success text-white">
                <div class="card-body text-center">
                    <h3>${resolvidos}</h3>
                    <small>Resolvidos</small>
                </div>
            </div>
        </div>
    `);
    
    const ultimos = chamados.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao)).slice(0, 5);
    
    if (ultimos.length === 0) {
        $('#tabela-ultimos-chamados-perfil').html('<tr><td colspan="6" class="text-center">Nenhum chamado encontrado.</td></tr>');
    } else {
        let html = '';
        ultimos.forEach(chamado => {
            const statusClass = {
                'aberto': 'bg-warning',
                'em_andamento': 'bg-info',
                'resolvido': 'bg-success'
            }[chamado.status] || 'bg-secondary';
            
            const prioridadeClass = {
                'baixa': 'bg-success',
                'media': 'bg-info',
                'alta': 'bg-warning',
                'urgente': 'bg-danger'
            }[chamado.prioridade] || 'bg-secondary';
            
            html += `
                <tr>
                    <td>#${chamado.id}</td>
                    <td>${chamado.titulo.substring(0, 30)}</td>
                    <td><span class="badge ${statusClass}">${chamado.status.replace('_', ' ')}</span></td>
                    <td><span class="badge ${prioridadeClass}">${chamado.prioridade}</span></td>
                    <td>${new Date(chamado.data_criacao).toLocaleDateString('pt-BR')}</td>
                    <td>
                        <a href="detalhe-chamado.html?id=${chamado.id}" class="btn btn-sm btn-outline-primary">
                            <i class="bi bi-eye"></i>
                        </a>
                    </td>
                </tr>
            `;
        });
        $('#tabela-ultimos-chamados-perfil').html(html);
    }
    
    let permissoesHtml = `
        <div class="col-md-6">
            <h6 class="text-success"><i class="bi bi-check-circle"></i> Você pode:</h6>
            <ul class="list-group">
                <li class="list-group-item"><i class="bi bi-check-circle text-success"></i> Abrir novos chamados</li>
                <li class="list-group-item"><i class="bi bi-check-circle text-success"></i> Acompanhar seus chamados</li>
    `;
    
    if (user.is_tecnico) {
        permissoesHtml += '<li class="list-group-item"><i class="bi bi-check-circle text-success"></i> Ser atribuído a chamados</li>';
    }
    
    if (user.is_admin) {
        permissoesHtml += `
            <li class="list-group-item"><i class="bi bi-check-circle text-success"></i> Gerenciar usuários</li>
            <li class="list-group-item"><i class="bi bi-check-circle text-success"></i> Gerenciar todos os chamados</li>
        `;
    }
    
    permissoesHtml += `</ul></div><div class="col-md-6"><h6 class="text-danger"><i class="bi bi-x-circle"></i> Você NÃO pode:</h6><ul class="list-group">`;
    
    if (!user.is_admin) {
        permissoesHtml += '<li class="list-group-item"><i class="bi bi-x-circle text-danger"></i> Gerenciar outros usuários</li>';
        permissoesHtml += '<li class="list-group-item"><i class="bi bi-x-circle text-danger"></i> Atualizar chamados de outros</li>';
    }
    
    if (!user.is_tecnico && !user.is_admin) {
        permissoesHtml += '<li class="list-group-item"><i class="bi bi-x-circle text-danger"></i> Ser atribuído como técnico</li>';
    }
    
    permissoesHtml += '<li class="list-group-item"><i class="bi bi-x-circle text-danger"></i> Excluir chamados</li></ul></div>';
    
    $('#permissoes-container').html(permissoesHtml);
    
    $('#edit_nome').val(user.nome);
    $('#edit_email').val(user.email);
}

function salvarPerfil() {
    const nome = $('#edit_nome').val();
    const email = $('#edit_email').val();
    const user = Auth.getCurrentUser();
    
    if (!nome || !email) {
        alert('Preencha todos os campos!');
        return;
    }
    
    if (email !== user.email) {
        const usuarioExistente = DB.getUsuarioByEmail(email);
        if (usuarioExistente) {
            alert('Este email já está em uso!');
            return;
        }
    }
    
    Auth.updateCurrentUser({ nome, email });
    $('#editarPerfilModal').modal('hide');
    alert('Perfil atualizado com sucesso!');
    location.reload();
}

function alterarSenha() {
    const senhaAtual = $('#senha_atual').val();
    const novaSenha = $('#nova_senha').val();
    const confirmar = $('#confirmar_senha').val();
    const user = Auth.getCurrentUser();
    
    if (!senhaAtual || !novaSenha || !confirmar) {
        alert('Preencha todos os campos!');
        return;
    }
    
    if (novaSenha !== confirmar) {
        alert('As novas senhas não conferem!');
        return;
    }
    
    if (novaSenha.length < 6) {
        alert('A nova senha deve ter no mínimo 6 caracteres!');
        return;
    }
    
    if (DB.hashSenha(senhaAtual) !== user.senha) {
        alert('Senha atual incorreta!');
        return;
    }
    
    Auth.updateCurrentUser({ senha: DB.hashSenha(novaSenha) });
    $('#alterarSenhaModal').modal('hide');
    $('#formAlterarSenha')[0].reset();
    alert('Senha alterada com sucesso!');
}