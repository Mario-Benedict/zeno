<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class NoteCollaborator extends Pivot
{
    public $timestamps = false;

    protected $table = 'note_collaborators';

    protected $casts = ['can_edit' => 'boolean'];
}
